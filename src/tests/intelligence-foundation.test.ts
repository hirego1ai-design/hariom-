import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chooseAssistantExecutionPath } from "../lib/intelligence/AssistantRouter";
import { resolveConversationLanguage } from "../lib/intelligence/LanguagePreference";
import { sanitizeIntelligenceJson, redactTextForIntelligence } from "../lib/intelligence/SafetyRedaction";
import { canTransitionAiArtifact } from "../lib/intelligence/EvalGate";
import { AiArtifactStage } from "@prisma/client";

test("deterministic read actions use fast path while consequential actions are critical", () => {
  assert.equal(chooseAssistantExecutionPath({ deterministic:true,requiresReasoning:false,risk:"READ" }),"FAST");
  assert.equal(chooseAssistantExecutionPath({ deterministic:false,requiresReasoning:true,risk:"READ" }),"SMART");
  assert.equal(chooseAssistantExecutionPath({ deterministic:true,requiresReasoning:false,risk:"CONSEQUENTIAL" }),"CRITICAL");
});
test("language selection priority is explicit then detected then stored", () => {
  assert.equal(resolveConversationLanguage({explicitLanguage:"hi-IN",detectedLanguage:"en",storedLanguage:"fr"}),"hi-IN");
  assert.equal(resolveConversationLanguage({detectedLanguage:"hi",storedLanguage:"en"}),"hi");
  assert.equal(resolveConversationLanguage({storedLanguage:"en-IN"}),"en-IN");
});
test("intelligence memory strips contact data and sensitive keyed values", () => {
  const text=redactTextForIntelligence("Contact person@example.com or +91 9876543210");
  assert.ok(!text.includes("person@example.com")); assert.ok(!text.includes("9876543210"));
  const sanitized=sanitizeIntelligenceJson({role:"Backend Engineer",password:"NeverStoreMe",nested:{otp:"123456",skill:"Redis"}});
  assert.equal(sanitized.removedSensitiveData,true); assert.deepEqual(sanitized.value,{role:"Backend Engineer",nested:{skill:"Redis"}});
});
test("eval gate cannot jump from draft to production", () => {
  assert.equal(canTransitionAiArtifact(AiArtifactStage.DRAFT,AiArtifactStage.SHADOW),true);
  assert.equal(canTransitionAiArtifact(AiArtifactStage.DRAFT,AiArtifactStage.PRODUCTION),false);
  assert.equal(canTransitionAiArtifact(AiArtifactStage.CANARY,AiArtifactStage.PRODUCTION),true);
});
test("pgvector is enabled without a hard-coded embedding dimension", () => {
  const schema=fs.readFileSync(path.resolve(process.cwd(),"prisma/schema.prisma"),"utf8");
  const migration=fs.readFileSync(path.resolve(process.cwd(),"prisma/migrations/20261005090000_intelligence_foundation/migration.sql"),"utf8");
  assert.ok(schema.includes('embedding           Unsupported("vector")?'));
  assert.ok(migration.includes("CREATE EXTENSION IF NOT EXISTS vector"));
  assert.ok(!migration.includes("vector(1536)"));
});
test("semantic embeddings require an explicitly approved embedding-capable model", () => {
  const config=fs.readFileSync(path.resolve(process.cwd(),"src/lib/ai/AiRoutingConfig.ts"),"utf8");
  const router=fs.readFileSync(path.resolve(process.cwd(),"src/lib/ai/ModelRouter.ts"),"utf8");
  const embedding=fs.readFileSync(path.resolve(process.cwd(),"src/lib/intelligence/EmbeddingDispatcher.ts"),"utf8");
  assert.ok(config.includes('"EMBEDDING"')); assert.ok(router.includes("requiredCapabilities")); assert.ok(embedding.includes('requiredCapabilities: ["EMBEDDING"]'));
});
test("critical factual evaluation has deterministic grounding support", () => {
  const evaluator=fs.readFileSync(path.resolve(process.cwd(),"src/lib/governance/AgentEvaluator.ts"),"utf8");
  assert.ok(evaluator.includes("GroundingVerifier")); assert.ok(evaluator.includes("requireFactualConsistency"));
});
