export type AssistantExecutionPath = "FAST" | "SMART" | "CRITICAL";
export type AssistantActionPolicy = { deterministic:boolean; requiresReasoning:boolean; risk:"READ"|"ROUTINE"|"CONSEQUENTIAL" };
export function chooseAssistantExecutionPath(policy:AssistantActionPolicy):AssistantExecutionPath {
  if(policy.risk==="CONSEQUENTIAL")return"CRITICAL";
  if(policy.deterministic&&!policy.requiresReasoning)return"FAST";
  return"SMART";
}
export async function executeAssistantAction<T>(params:{policy:AssistantActionPolicy;fast:()=>Promise<T>;smart:()=>Promise<T>;critical:()=>Promise<T>}):Promise<{path:AssistantExecutionPath;result:T}>{
  const path=chooseAssistantExecutionPath(params.policy);
  if(path==="FAST")return{path,result:await params.fast()};
  if(path==="SMART")return{path,result:await params.smart()};
  return{path,result:await params.critical()};
}
