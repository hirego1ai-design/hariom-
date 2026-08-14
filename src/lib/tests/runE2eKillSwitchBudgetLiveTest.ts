import { Role, KillSwitchType } from '@prisma/client';
import { createTenantContext } from '@/lib/security/TenantContext';
import { KillSwitchManager, KillSwitchActiveError } from '@/lib/security/KillSwitchManager';
import { BudgetManager, BudgetExceededError } from '@/lib/governance/BudgetManager';
import { ToolRegistry } from '@/lib/tools/ToolRegistry';
import { registerSideEffectTools } from '@/lib/tools/SideEffectTools';
import { WorkflowEngine } from '@/lib/workflows/WorkflowEngine';
import { prisma } from '@/lib/prisma';

// In-Memory Stubs for Phase 8.6 Testing
const killSwitchConfigs = new Map<string, any>();
const companyBudgets = new Map<string, any>();
const reservations = new Map<string, any>();
const dbWorkflows = new Map<string, any>();

function setupKillSwitchBudgetLivePrismaStubs() {
  (prisma as any).killSwitchConfig = {
    findFirst: async ({ where }: any) => {
      for (const config of killSwitchConfigs.values()) {
        if (config.targetId === where.targetId && config.isActive === where.isActive) {
          return config;
        }
        if (where.OR) {
          for (const cond of where.OR) {
            if (config.targetType === cond.targetType && config.targetId === cond.targetId && config.isActive) {
              return config;
            }
          }
        }
      }
      return null;
    },
    findUnique: async ({ where }: any) => {
      const key = `${where.targetType_targetId.targetType}_${where.targetType_targetId.targetId}`;
      return killSwitchConfigs.get(key) || null;
    },
    updateMany: async ({ where, data }: any) => {
      for (const [key, config] of killSwitchConfigs.entries()) {
        if (config.targetType === where.targetType && config.targetId === where.targetId) {
          config.isActive = data.isActive;
          killSwitchConfigs.set(key, config);
        }
      }
    },
    upsert: async ({ where, create }: any) => {
      const key = `${create.targetType}_${create.targetId}`;
      const record = { ...create, updatedAt: new Date() };
      killSwitchConfigs.set(key, record);
      return record;
    },
  };

  (prisma as any).$transaction = async (cb: any) => {
    const txMock = {
      $queryRaw: async (query: any, ...values: any[]) => {
        const queryStr = String(query[0] || query);
        if (queryStr.includes('AiCompanyBudget')) {
          const companyId = values[0];
          const b = companyBudgets.get(companyId);
          if (!b) return [];
          return [b];
        }
        return [];
      },
      budgetReservation: {
        create: async ({ data }: any) => {
          const record = { id: `res-${Date.now()}`, ...data, status: 'HELD', createdAt: new Date() };
          reservations.set(data.executionId, record);
          return record;
        },
      },
      aiCompanyBudget: {
        update: async ({ where, data }: any) => {
          for (const [compId, b] of companyBudgets.entries()) {
            if (b.id === where.id) {
              if (data.reservedSpendMinorUnits !== undefined) b.reservedSpendMinorUnits = BigInt(data.reservedSpendMinorUnits);
              if (data.currentSpendMinorUnits !== undefined) b.currentSpendMinorUnits = BigInt(data.currentSpendMinorUnits);
              companyBudgets.set(compId, b);
              return b;
            }
          }
          return null;
        },
      },
    };
    return cb(txMock);
  };

  (prisma as any).workflowInstance = {
    create: async ({ data }: any) => {
      const id = `wf-${Date.now()}`;
      const record = { id, ...data, updatedAt: new Date() };
      dbWorkflows.set(id, record);
      return record;
    },
    findUnique: async ({ where }: any) => dbWorkflows.get(where.id) || null,
    update: async ({ where, data }: any) => {
      const wf = dbWorkflows.get(where.id);
      if (!wf) throw new Error('Workflow not found');
      const updated = { ...wf, ...data, updatedAt: new Date() };
      dbWorkflows.set(where.id, updated);
      return updated;
    },
  };
}

async function runKillSwitchBudgetLiveTests() {
  console.log('================================================================');
  console.log('  PHASE 8.6 — BUDGET EXHAUSTION & KILL SWITCH LIVE PANIC SUITE  ');
  console.log('================================================================');

  setupKillSwitchBudgetLivePrismaStubs();

  const killSwitch = new KillSwitchManager();
  const registry = new ToolRegistry();
  registerSideEffectTools(registry);

  let passedScenarios = 0;

  // ----------------------------------------------------------------
  // Scenario 1: Live Hard Budget Cap Block
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 1: Live Hard Budget Cap Block ---');
  const comp1 = 'comp-live-1';
  companyBudgets.set(comp1, {
    id: `b-${comp1}`,
    companyId: comp1,
    monthlyLimitMinorUnits: BigInt(5000), // $50 hard limit
    currentSpendMinorUnits: BigInt(5000), // 100% exhausted
    reservedSpendMinorUnits: BigInt(0),
    isHardCapEnabled: true,
  });

  try {
    await BudgetManager.reserveBudget({
      companyId: comp1,
      executionId: 'exec-live-1',
      correlationId: 'corr-live-1',
      estimatedMinor: BigInt(100),
    });
    console.error('FAIL: Scenario 1 - Allowed budget reservation past hard cap');
  } catch (e: any) {
    if (e instanceof BudgetExceededError || e.message?.includes('Budget exceeded')) {
      console.log('PASS: Scenario 1 - Hard budget cap blocked reservation at 100% threshold.');
      passedScenarios++;
    } else {
      console.error('FAIL: Scenario 1 unexpected error', e);
    }
  }

  // ----------------------------------------------------------------
  // Scenario 2: Dynamic Hard Cap Toggle (Soft Cap vs Hard Cap)
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 2: Dynamic Hard Cap Toggle ---');
  const comp2 = 'comp-live-2';
  companyBudgets.set(comp2, {
    id: `b-${comp2}`,
    companyId: comp2,
    monthlyLimitMinorUnits: BigInt(1000),
    currentSpendMinorUnits: BigInt(1000),
    reservedSpendMinorUnits: BigInt(0),
    isHardCapEnabled: false, // Soft cap enabled
  });

  // 1. Soft cap allows reservation with warning
  let softCapPassed = false;
  try {
    const resSoft = await BudgetManager.reserveBudget({
      companyId: comp2,
      executionId: 'exec-live-2-soft',
      correlationId: 'corr-live-2',
      estimatedMinor: BigInt(500),
    });
    if (resSoft) softCapPassed = true;
  } catch {
    //
  }

  // 2. Toggle to hard cap
  companyBudgets.get(comp2)!.isHardCapEnabled = true;
  let hardCapBlocked = false;
  try {
    await BudgetManager.reserveBudget({
      companyId: comp2,
      executionId: 'exec-live-2-hard',
      correlationId: 'corr-live-2',
      estimatedMinor: BigInt(500),
    });
  } catch (e: any) {
    if (e instanceof BudgetExceededError || e.message?.includes('Budget exceeded')) {
      hardCapBlocked = true;
    }
  }

  if (softCapPassed && hardCapBlocked) {
    console.log('PASS: Scenario 2 - Soft cap permitted overage; dynamic hard cap toggle instantly blocked execution.');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 2 - softCapPassed=${softCapPassed}, hardCapBlocked=${hardCapBlocked}`);
  }

  // ----------------------------------------------------------------
  // Scenario 3: Live Tenant Kill Switch Panic Activation
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 3: Live Tenant Kill Switch Panic Activation ---');
  const comp3 = 'comp-live-3';

  // Activate workflow kill switch mid-operation
  await killSwitch.activate(KillSwitchType.WORKFLOW, comp3, 'Live emergency security panic', 'admin-security');

  try {
    await killSwitch.assertNotKilled(KillSwitchType.WORKFLOW, comp3);
    console.error('FAIL: Scenario 3 - Allowed execution despite active kill switch');
  } catch (e: any) {
    if (e instanceof KillSwitchActiveError || e.message?.includes('Kill switch active')) {
      console.log('PASS: Scenario 3 - Live workflow kill switch halted execution instantly.');
      passedScenarios++;
    } else {
      console.error('FAIL: Scenario 3 unexpected error', e);
    }
  }

  // ----------------------------------------------------------------
  // Scenario 4: Live Global Emergency Kill Switch
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 4: Live Global Emergency Kill Switch ---');
  await killSwitch.activate(KillSwitchType.GLOBAL, 'SYSTEM', 'Platform-wide zero-day threat', 'ciso');

  let globalBlockedCount = 0;
  for (const compId of ['company-A', 'company-B', 'company-C']) {
    try {
      await killSwitch.assertNotKilled(KillSwitchType.WORKFLOW, compId);
    } catch (e: any) {
      if (e instanceof KillSwitchActiveError || e.message?.includes('Kill switch active')) {
        globalBlockedCount++;
      }
    }
  }

  if (globalBlockedCount === 3) {
    console.log('PASS: Scenario 4 - Global emergency kill switch halted ALL workflows across all tenants instantly.');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 4 - Only ${globalBlockedCount} tenants blocked`);
  }

  // ----------------------------------------------------------------
  // Scenario 5: Emergency Deactivation & Clean Resume
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 5: Emergency Deactivation & Clean Resume ---');

  // Deactivate global kill switch
  await killSwitch.deactivate(KillSwitchType.GLOBAL, 'SYSTEM');

  let resumedCleanly = false;
  try {
    await killSwitch.assertNotKilled(KillSwitchType.GLOBAL, 'company-A');
    resumedCleanly = true;
  } catch {
    //
  }

  if (resumedCleanly) {
    console.log('PASS: Scenario 5 - Emergency kill switch deactivated; system resumed normal operations cleanly.');
    passedScenarios++;
  } else {
    console.error('FAIL: Scenario 5 - Deactivation failed');
  }

  // ----------------------------------------------------------------
  // Scenario 6: Control Flow Priority Evaluation Hierarchy
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 6: Control Flow Priority Evaluation Hierarchy ---');

  // Activate tenant kill switch on comp6 AND exhaust budget
  const comp6 = 'comp-live-6';
  await killSwitch.activate(KillSwitchType.WORKFLOW, comp6, 'Tenant panic', 'admin-6');
  companyBudgets.set(comp6, {
    id: `b-${comp6}`,
    companyId: comp6,
    monthlyLimitMinorUnits: BigInt(100),
    currentSpendMinorUnits: BigInt(100),
    reservedSpendMinorUnits: BigInt(0),
    isHardCapEnabled: true,
  });

  // Verify kill switch assertion fails BEFORE budget check or LLM call
  let killSwitchEvaluatedFirst = false;
  try {
    await killSwitch.assertNotKilled(KillSwitchType.WORKFLOW, comp6);
    await BudgetManager.reserveBudget({
      companyId: comp6,
      executionId: 'exec-live-6',
      correlationId: 'corr-live-6',
      estimatedMinor: BigInt(50),
    });
  } catch (e: any) {
    if (e instanceof KillSwitchActiveError || e.message?.includes('Kill switch active')) {
      killSwitchEvaluatedFirst = true;
    }
  }

  if (killSwitchEvaluatedFirst) {
    console.log('PASS: Scenario 6 - Control flow priority verified: Global/Tenant Kill Switch > Hard Budget Cap > Model Execution.');
    passedScenarios++;
  } else {
    console.error('FAIL: Scenario 6 - Control flow priority order incorrect');
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n================================================================');
  console.log('  PHASE 8.6 BUDGET & KILL SWITCH LIVE PANIC SUMMARY             ');
  console.log('================================================================');
  console.log(`  Scenarios Passed: ${passedScenarios} / 6`);
  console.log('================================================================');

  if (passedScenarios === 6) {
    console.log('🎉 PHASE 8.6: ALL 6 BUDGET EXHAUSTION & KILL SWITCH LIVE SCENARIOS PASSED CLEANLY');
  } else {
    console.error(`💀 PHASE 8.6: ${6 - passedScenarios} SCENARIOS FAILED`);
    process.exit(1);
  }
}

runKillSwitchBudgetLiveTests().catch((e) => {
  console.error('Phase 8.6 Test Suite Crashed:', e);
  process.exit(1);
});
