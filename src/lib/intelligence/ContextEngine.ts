import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRedisValue, setRedisValue } from "@/lib/redis";
import { LanguagePreferenceService, resolveConversationLanguage } from "@/lib/intelligence/LanguagePreference";
import { SemanticMemory } from "@/lib/intelligence/SemanticMemory";
import { IntelligenceActor, IntelligenceScope, assertIntelligenceScopeAccess } from "@/lib/intelligence/ScopeAuthorization";
import { sanitizeIntelligenceJson } from "@/lib/intelligence/SafetyRedaction";

const SESSION_TTL_SECONDS=2*60*60;
function sessionKey(userId:string,conversationKey:string){return`assistant:context:v1:${userId}:${conversationKey.replace(/[^A-Za-z0-9:_-]/g,"").slice(0,120)}`;}

export class ContextEngine{
  static async setSessionContext(params:{actor:IntelligenceActor;conversationKey:string;context:unknown}){
    const sanitized=sanitizeIntelligenceJson(params.context);
    await setRedisValue(sessionKey(params.actor.userId,params.conversationKey),JSON.stringify(sanitized.value),SESSION_TTL_SECONDS);
  }
  static async build(params:{actor:IntelligenceActor;agentId:string;scopes:IntelligenceScope[];conversationKey:string;query?:string;explicitLanguage?:string|null;detectedLanguage?:string|null}){
    for(const scope of params.scopes)await assertIntelligenceScopeAccess(params.actor,scope);
    const [preference,redisRaw]=await Promise.all([LanguagePreferenceService.get(params.actor.userId),getRedisValue(sessionKey(params.actor.userId,params.conversationKey)).catch(()=>null)]);
    let sessionContext:unknown=null; if(redisRaw){try{sessionContext=JSON.parse(redisRaw);}catch{sessionContext=null;}}
    const now=new Date();
    const structured=await prisma.agentMemoryRecord.findMany({where:{
      agentId:params.agentId,
      OR:params.scopes.map((scope)=>({scopeLevel:scope.scopeLevel,scopeId:scope.scopeId})),
      AND:[
        {OR:[{expiresAt:null},{expiresAt:{gt:now}}]},
        ...(params.actor.role===Role.ADMIN?[]:params.actor.companyId?[{OR:[{companyId:null},{companyId:params.actor.companyId}]}]:[{companyId:null}]),
      ],
    },orderBy:{updatedAt:"desc"},take:20});
    let semantic:Awaited<ReturnType<typeof SemanticMemory.search>>=[]; let semanticMemoryAvailable=true;
    if(params.query?.trim()){try{semantic=await SemanticMemory.search({actor:params.actor,scopes:params.scopes,query:params.query,agentId:params.agentId,limit:8});}catch{semanticMemoryAvailable=false;}}
    return{
      actor:params.actor,scopes:params.scopes,
      language:resolveConversationLanguage({explicitLanguage:params.explicitLanguage,detectedLanguage:preference?.autoDetectLanguage===false?null:params.detectedLanguage,storedLanguage:preference?.preferredLanguage}),
      allowCodeSwitching:preference?.allowCodeSwitching??true,preferredVoiceKey:preference?.preferredVoiceKey??null,sessionContext,
      structuredMemory:structured.map((item)=>({scopeLevel:item.scopeLevel,scopeId:item.scopeId,memoryType:item.memoryType,key:item.key,value:item.value,updatedAt:item.updatedAt})),
      semanticMemory:semantic.map((item)=>({scopeLevel:item.scopeLevel,scopeId:item.scopeId,sourceType:item.sourceType,sourceId:item.sourceId,content:item.content,metadata:item.metadata,similarity:item.similarity})),
      semanticMemoryAvailable,
    };
  }
}
