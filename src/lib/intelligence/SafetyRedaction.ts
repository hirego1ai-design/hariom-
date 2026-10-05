import { createHash } from "crypto";

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}\b/i,
  /\b(?:password|passwd|pwd|otp|cvv|api[_ -]?key|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*[^\s,;]{4,}/i,
];

const SENSITIVE_KEY = /(?:password|passwd|pwd|otp|token|secret|api.?key|authorization|cookie|session|card|cvv|pin|race|ethnicity|religion|disability|health|medical|gender|sex|sexual.?orientation|date.?of.?birth|dob)/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?<!\d)(?:\+?\d[\d ()-]{7,}\d)(?!\d)/g;
const LONG_DIGITS = /(?<!\d)\d{12,19}(?!\d)/g;

export class UnsafeIntelligenceContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeIntelligenceContentError";
  }
}

export function assertNoSecretMaterial(value: string): void {
  if (SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new UnsafeIntelligenceContentError("Secret-like material is not allowed in intelligence memory or learning data.");
  }
}

export function redactTextForIntelligence(value: string, maxLength = 8_000): string {
  const bounded = value.trim().slice(0, maxLength);
  assertNoSecretMaterial(bounded);
  return bounded.replace(EMAIL, "[redacted-email]").replace(PHONE, "[redacted-phone]").replace(LONG_DIGITS, "[redacted-number]");
}

export function sanitizeIntelligenceJson(value: unknown, depth = 0): { value: unknown; removedSensitiveData: boolean } {
  if (depth > 8) return { value: "[truncated-depth]", removedSensitiveData: false };
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") return { value, removedSensitiveData: false };
  if (typeof value === "string") {
    try {
      const sanitized = redactTextForIntelligence(value, 5_000);
      return { value: sanitized, removedSensitiveData: sanitized !== value.trim().slice(0, 5_000) };
    } catch {
      return { value: "[redacted-secret]", removedSensitiveData: true };
    }
  }
  if (Array.isArray(value)) {
    let removed = value.length > 100;
    const items = value.slice(0, 100).map((item) => {
      const next = sanitizeIntelligenceJson(item, depth + 1);
      removed ||= next.removedSensitiveData;
      return next.value;
    });
    return { value: items, removedSensitiveData: removed };
  }
  if (typeof value === "object") {
    let removed = false;
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      if (SENSITIVE_KEY.test(key)) {
        removed = true;
        continue;
      }
      const next = sanitizeIntelligenceJson(raw, depth + 1);
      removed ||= next.removedSensitiveData;
      output[key.slice(0, 120)] = next.value;
    }
    return { value: output, removedSensitiveData: removed };
  }
  return { value: String(value).slice(0, 500), removedSensitiveData: false };
}

export function intelligenceDedupeKey(parts: Array<string | null | undefined>): string {
  return createHash("sha256").update(parts.filter(Boolean).join("\u001f")).digest("hex");
}
