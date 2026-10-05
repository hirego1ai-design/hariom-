import { MemoryScopeLevel, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { IntelligenceActor, assertIntelligenceScopeAccess } from "@/lib/intelligence/ScopeAuthorization";

export type EvidenceKind = "CANDIDATE_SKILL" | "SKILL_EVIDENCE" | "APPLICATION" | "JOB" | "INTERVIEW" | "READINESS" | "WORKFLOW";
export type EvidenceAssertion = { kind: EvidenceKind; id: string; field: string; operator: "EQ" | "GTE" | "LTE" | "INCLUDES"; expected: string | number | boolean | null };

const ALLOWED_FIELDS: Record<EvidenceKind, Set<string>> = {
  CANDIDATE_SKILL: new Set(["name","normalizedName","verificationStatus","claimedLevel","verifiedLevel","latestScore","validUntil","candidateProfileId"]),
  SKILL_EVIDENCE: new Set(["evidenceType","score","qualifiesVerification","roleTitle","seniority","validUntil","candidateSkillId"]),
  APPLICATION: new Set(["status","matchScore","jobId","candidateProfileId"]),
  JOB: new Set(["title","status","companyId","experienceLevel","location"]),
  INTERVIEW: new Set(["status","scheduledAt","transcriptConfidence","applicationId"]),
  READINESS: new Set(["roleTitle","seniority","status","score","validUntil","candidateProfileId"]),
  WORKFLOW: new Set(["status","currentStep","workflowType","companyId"]),
};
function comparable(value: unknown): string | number | boolean | null {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
function matches(actual: unknown, assertion: EvidenceAssertion): boolean {
  const a = comparable(actual), e = assertion.expected;
  if (assertion.operator === "EQ") return String(a) === String(e);
  if (assertion.operator === "GTE") return typeof a === "number" && typeof e === "number" && a >= e;
  if (assertion.operator === "LTE") return typeof a === "number" && typeof e === "number" && a <= e;
  return typeof a === "string" && a.toLowerCase().includes(String(e ?? "").toLowerCase());
}
async function loadAndAuthorize(actor: IntelligenceActor, assertion: EvidenceAssertion): Promise<Record<string, unknown> | null> {
  if (!ALLOWED_FIELDS[assertion.kind].has(assertion.field)) return null;
  if (assertion.kind === "CANDIDATE_SKILL") {
    const row = await prisma.candidateSkill.findUnique({ where: { id: assertion.id } }); if (!row) return null;
    await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.CANDIDATE,scopeId:row.candidateProfileId}); return row as any;
  }
  if (assertion.kind === "SKILL_EVIDENCE") {
    const row = await prisma.skillEvidence.findUnique({ where:{id:assertion.id},include:{candidateSkill:{select:{candidateProfileId:true}}}}); if(!row)return null;
    await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.CANDIDATE,scopeId:row.candidateSkill.candidateProfileId}); return row as any;
  }
  if (assertion.kind === "APPLICATION") {
    const row=await prisma.application.findUnique({where:{id:assertion.id}}); if(!row)return null; await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.APPLICATION,scopeId:row.id}); return row as any;
  }
  if (assertion.kind === "JOB") {
    const row=await prisma.jobListing.findUnique({where:{id:assertion.id}}); if(!row)return null; if(actor.role!==Role.ADMIN)await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.JOB,scopeId:row.id}); return row as any;
  }
  if (assertion.kind === "INTERVIEW") {
    const row=await prisma.interview.findUnique({where:{id:assertion.id}}); if(!row)return null; await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.INTERVIEW,scopeId:row.id}); return row as any;
  }
  if (assertion.kind === "READINESS") {
    const row=await prisma.candidateReadiness.findUnique({where:{id:assertion.id}}); if(!row)return null; await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.CANDIDATE,scopeId:row.candidateProfileId}); return row as any;
  }
  const row=await prisma.workflowInstance.findUnique({where:{id:assertion.id}}); if(!row)return null; await assertIntelligenceScopeAccess(actor,{scopeLevel:MemoryScopeLevel.WORKFLOW,scopeId:row.id}); return row as any;
}
export class GroundingVerifier {
  static async verify(params:{actor:IntelligenceActor;assertions:EvidenceAssertion[]}) {
    if(params.assertions.length===0)return{factualConsistency:false,verified:0,failures:["No evidence assertions were supplied."]};
    const failures:string[]=[]; let verified=0;
    for(const assertion of params.assertions.slice(0,100)){
      try{const row=await loadAndAuthorize(params.actor,assertion); if(!row){failures.push(`${assertion.kind}:${assertion.id} could not be verified.`);continue;}
      if(!matches(row[assertion.field],assertion)){failures.push(`${assertion.kind}:${assertion.id}.${assertion.field} did not match the asserted value.`);continue;} verified+=1;}
      catch{failures.push(`${assertion.kind}:${assertion.id} was not authorized or could not be verified.`);}
    }
    return{factualConsistency:failures.length===0&&verified===params.assertions.length,verified,failures};
  }
}
