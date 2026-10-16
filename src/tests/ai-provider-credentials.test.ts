import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  encryptAiProviderKey, decryptAiProviderKey, validateAiProviderEndpoint,
} from "../lib/ai/AiProviderCredentials";
import { getProviderApiKey, getProviderRuntime, llmProviderSchema } from "../lib/ai/AiRoutingConfig";

const originalKey = process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY;
const originalHosts = process.env.AI_SELF_HOSTED_ALLOWED_HOSTS;
const originalGroqKey = process.env.GROQ_API_KEY;
const originalGroqBaseUrl = process.env.GROQ_BASE_URL;

test("every Model Registry provider can be configured from Admin", () => {
  assert.deepEqual(llmProviderSchema.options, ["openai", "gemini", "deepseek", "kimi", "qwen", "groq", "self_hosted"]);
});

test("Groq uses the official OpenAI-compatible endpoint and server-side API key", () => {
  process.env.GROQ_API_KEY = "gsk-test-not-a-real-key";
  delete process.env.GROQ_BASE_URL;
  try {
    assert.deepEqual(getProviderRuntime("groq"), {
      configured: true,
      baseURL: "https://api.groq.com/openai/v1",
    });
    assert.equal(getProviderApiKey("groq"), "gsk-test-not-a-real-key");
    delete process.env.GROQ_API_KEY;
    assert.deepEqual(getProviderRuntime("groq"), {
      configured: false,
      reason: "GROQ_API_KEY is missing",
    });
  } finally {
    if (originalGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalGroqKey;
    if (originalGroqBaseUrl === undefined) delete process.env.GROQ_BASE_URL;
    else process.env.GROQ_BASE_URL = originalGroqBaseUrl;
  }
});

test("AES-GCM encrypts AI keys with a provider-specific authenticated binding", () => {
  process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 27).toString("base64");
  try {
    const plaintext = "sk-test-secret-not-a-real-token";
    const ciphertext = encryptAiProviderKey("openai", plaintext);
    assert.ok(ciphertext.startsWith("v1:"));
    assert.ok(!ciphertext.includes(plaintext));
    assert.equal(decryptAiProviderKey("openai", ciphertext), plaintext);
    assert.throws(() => decryptAiProviderKey("gemini", ciphertext));
    const fields = ciphertext.split(":");
    fields[2] = Buffer.from("tampered").toString("base64url");
    assert.throws(() => decryptAiProviderKey("openai", fields.join(":")));
  } finally {
    if (originalKey === undefined) delete process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY;
    else process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY = originalKey;
  }
});

test("missing encryption master key blocks key persistence", () => {
  delete process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY;
  try {
    assert.throws(() => encryptAiProviderKey("gemini", "secret-for-test"));
  } finally {
    if (originalKey !== undefined) process.env.AI_PROVIDER_CREDENTIALS_ENCRYPTION_KEY = originalKey;
  }
});

test("untrusted/private LLM endpoints are rejected", () => {
  assert.throws(() => validateAiProviderEndpoint("openai", "https://example.com/v1"));
  assert.throws(() => validateAiProviderEndpoint("qwen", "http://dashscope.aliyuncs.com/v1"));
  assert.throws(() => validateAiProviderEndpoint("qwen", "https://127.0.0.1/v1"));
  assert.throws(() => validateAiProviderEndpoint("qwen", "https://fake-dashscope.aliyuncs.com/v1"));
  assert.equal(
    validateAiProviderEndpoint("qwen", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"),
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  );
  process.env.AI_SELF_HOSTED_ALLOWED_HOSTS = "models.example.com";
  try {
    assert.throws(() => validateAiProviderEndpoint("self_hosted", "https://example.com/v1"));
    assert.equal(validateAiProviderEndpoint("self_hosted", "https://models.example.com/v1"), "https://models.example.com/v1");
  } finally {
    if (originalHosts === undefined) delete process.env.AI_SELF_HOSTED_ALLOWED_HOSTS;
    else process.env.AI_SELF_HOSTED_ALLOWED_HOSTS = originalHosts;
  }
});

test("runtime uses persisted credentials rather than env-only LLM keys", () => {
  const aiRouter = readFileSync("src/utils/aiRouter.ts", "utf-8");
  const router = readFileSync("src/lib/ai/ModelRouter.ts", "utf-8");
  const api = readFileSync("src/app/api/admin/ai-provider-credentials/route.ts", "utf-8");
  assert.match(aiRouter, /await resolveAiProvider\(provider\)/);
  assert.match(router, /await getResolvedAiProviderStatuses\(\)/);
  assert.match(api, /encryptAiProviderKey/);
  assert.match(api, /enqueueSecurityAuditEvent/);
  assert.ok(!api.includes("apiKey: input.apiKey"), "raw keys must never be persisted or echoed");
  assert.ok(!api.includes("apiKey: body.apiKey"), "raw keys must never be persisted or echoed");
});
