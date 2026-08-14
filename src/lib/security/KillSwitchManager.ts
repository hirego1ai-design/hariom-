import { prisma } from '@/lib/prisma';
import { KillSwitchType, KillSwitchConfig } from '@prisma/client';

export class KillSwitchActiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KillSwitchActiveError';
  }
}

/**
 * 5-tier kill switch system.
 * Check order: GLOBAL first, then specific type.
 * GLOBAL kill switch (targetId = 'SYSTEM') stops ALL agent execution.
 */
export class KillSwitchManager {
  /**
   * Checks if a specific kill switch (or the global one) is active.
   * @param targetType The type of the kill switch.
   * @param targetId The ID of the target.
   * @returns True if the kill switch is active.
   */
  async isKilled(targetType: KillSwitchType, targetId: string): Promise<boolean> {
    const isGlobalKilled = await this.checkGlobalKillSwitch();
    if (isGlobalKilled) {
      return true;
    }

    try {
      const switchConfig = await prisma.killSwitchConfig.findUnique({
        where: {
          targetType_targetId: {
            targetType,
            targetId,
          },
        },
      });
      return switchConfig?.isActive ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Checks multiple kill switches in one query.
   * @param checks An array of targetType and targetId objects to check.
   * @returns True if any of the specified kill switches are active.
   */
  async isAnyKilled(
    checks: Array<{ targetType: KillSwitchType; targetId: string }>
  ): Promise<boolean> {
    if (checks.length === 0) return false;

    const isGlobalKilled = await this.checkGlobalKillSwitch();
    if (isGlobalKilled) {
      return true;
    }

    const orConditions = checks.map((c) => ({
      targetType: c.targetType,
      targetId: c.targetId,
    }));

    const activeSwitch = await prisma.killSwitchConfig.findFirst({
      where: {
        OR: orConditions,
        isActive: true,
      },
    });

    return activeSwitch !== null;
  }

  /**
   * Activates a kill switch. Uses upsert for idempotency.
   * @param targetType The type of the kill switch.
   * @param targetId The ID of the target.
   * @param reason The reason for activation.
   * @param activatedBy The ID of the user/system activating the switch.
   */
  async activate(
    targetType: KillSwitchType,
    targetId: string,
    reason: string,
    activatedBy: string
  ): Promise<void> {
    await prisma.killSwitchConfig.upsert({
      where: {
        targetType_targetId: {
          targetType,
          targetId,
        },
      },
      update: {
        isActive: true,
        reason,
        activatedBy,
      },
      create: {
        targetType,
        targetId,
        isActive: true,
        reason,
        activatedBy,
      },
    });
  }

  /**
   * Deactivates a kill switch.
   * @param targetType The type of the kill switch.
   * @param targetId The ID of the target.
   */
  async deactivate(targetType: KillSwitchType, targetId: string): Promise<void> {
    await prisma.killSwitchConfig.updateMany({
      where: {
        targetType,
        targetId,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Retrieves all currently active kill switches.
   * @returns A list of active KillSwitchConfig objects.
   */
  async getActiveKillSwitches(): Promise<KillSwitchConfig[]> {
    return prisma.killSwitchConfig.findMany({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Asserts that a specific target is not killed.
   * @param targetType The type of the kill switch.
   * @param targetId The ID of the target.
   * @throws {KillSwitchActiveError} If the kill switch is active.
   */
  async assertNotKilled(targetType: KillSwitchType, targetId: string): Promise<void> {
    const killed = await this.isKilled(targetType, targetId);
    if (killed) {
      throw new KillSwitchActiveError(
        `Execution aborted: Kill switch active for ${targetType} - ${targetId}`
      );
    }
  }

  /**
   * Checks if the global kill switch (targetId = 'SYSTEM') is active.
   */
  private async checkGlobalKillSwitch(): Promise<boolean> {
    try {
      const globalSwitch = await prisma.killSwitchConfig.findFirst({
        where: {
          targetId: 'SYSTEM',
          isActive: true,
        },
      });
      return globalSwitch !== null;
    } catch {
      return false;
    }
  }
}
