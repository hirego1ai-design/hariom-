import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logCriticalAuditEvent } from "@/lib/auditLogger";
import { communicationEventDefinition, validateTemplateVariables } from "@/lib/communications/catalog";

const schema=z.object({
 name:z.string().trim().min(3).max(120).optional(),
 providerTemplateId:z.string().trim().max(512).nullable().optional(),
 providerAlias:z.string().trim().max(512).nullable().optional(),
 subject:z.string().trim().max(200).nullable().optional(),
 body:z.string().min(1).max(20000).optional(),
 enabled:z.boolean().optional(),
}).strict();

async function admin(request:Request){const s=await getCurrentSession(request.headers);if(!s||s.role!=="ADMIN")throw new ApiError("Unauthorized: Admin role required.",401);return s}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const user=await admin(request);await enforceRateLimit(request,`admin_communication_template_update:${user.id}`,20,60000);
  const {id}=await params;const body=await readValidatedJson(request,schema);
  const current=await prisma.communicationTemplate.findUnique({where:{id}});if(!current)throw new ApiError("Template not found.",404);
  const nextSubject=body.subject===undefined?current.subject:body.subject;const nextBody=body.body??current.body;
  const check=validateTemplateVariables(current.eventKey as any,nextSubject||undefined,nextBody);if(!check.valid)throw new ApiError(`Unapproved variables: ${check.unknown.join(", ")}`,422);
  if(body.enabled===true&&!((body.providerAlias??current.providerAlias)||(body.providerTemplateId??current.providerTemplateId)))throw new ApiError("Provider mapping is required before activation.",422);
  const updated=await prisma.$transaction(async tx=>{
   if(body.enabled===true)await tx.communicationTemplate.updateMany({where:{eventKey:current.eventKey,channel:current.channel,audience:current.audience,locale:current.locale,enabled:true,id:{not:id}},data:{enabled:false,status:"SUPERSEDED"}});
   return tx.communicationTemplate.update({where:{id},data:{...body,status:body.enabled===true?"ACTIVE":body.enabled===false?"DRAFT":current.status,updatedById:user.id}});
  });
  await logCriticalAuditEvent({userId:user.id,action:"COMMUNICATION_TEMPLATE_UPDATED",resource:`CommunicationTemplate:${id}`,details:`event=${updated.eventKey}; channel=${updated.channel}; enabled=${updated.enabled}; version=${updated.version}`});
  return NextResponse.json({success:true,template:updated});
 }catch(e){return handleApiError(e)}
}
