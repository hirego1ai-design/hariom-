import { prisma } from "@/lib/prisma";

const LANGUAGE_TAG = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8}){0,3}$/;
function cleanLanguage(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (!LANGUAGE_TAG.test(normalized)) throw new Error("Language preference must be a bounded BCP-47 style language tag.");
  return normalized;
}
export function resolveConversationLanguage(params: { explicitLanguage?: string | null; detectedLanguage?: string | null; storedLanguage?: string | null; fallbackLanguage?: string }): string {
  return cleanLanguage(params.explicitLanguage) ?? cleanLanguage(params.detectedLanguage) ?? cleanLanguage(params.storedLanguage) ?? cleanLanguage(params.fallbackLanguage ?? "en") ?? "en";
}
export class LanguagePreferenceService {
  static async get(userId: string) { return prisma.userAiPreference.findUnique({ where: { userId } }); }
  static async save(params: { userId: string; preferredLanguage?: string | null; autoDetectLanguage?: boolean; allowCodeSwitching?: boolean; preferredVoiceKey?: string | null }) {
    const preferredLanguage = params.preferredLanguage === undefined ? undefined : cleanLanguage(params.preferredLanguage);
    const preferredVoiceKey = params.preferredVoiceKey === undefined ? undefined : params.preferredVoiceKey?.trim().slice(0,120) || null;
    return prisma.userAiPreference.upsert({
      where: { userId: params.userId },
      create: { userId: params.userId, preferredLanguage: preferredLanguage ?? null, autoDetectLanguage: params.autoDetectLanguage ?? true, allowCodeSwitching: params.allowCodeSwitching ?? true, preferredVoiceKey: preferredVoiceKey ?? null },
      update: { ...(preferredLanguage !== undefined ? { preferredLanguage } : {}), ...(params.autoDetectLanguage !== undefined ? { autoDetectLanguage: params.autoDetectLanguage } : {}), ...(params.allowCodeSwitching !== undefined ? { allowCodeSwitching: params.allowCodeSwitching } : {}), ...(preferredVoiceKey !== undefined ? { preferredVoiceKey } : {}) },
    });
  }
}
