import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEmployerOrAdminSession, getSessionCompany } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const schema=z.object({candidateProfileId:z.string().uuid(),action:z.enum(["SHORTLIST","INVITE"])}).strict();
const WINDOW=30;
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const session=await requireEmployerOrAdminSession(req);await enforceRateLimit(req,"employer_sourcing_action",30);const {id:jobId}=await params;const body=await readValidatedJson(req,schema);
 const job=await prisma.jobListing.findUnique({where:{id:jobId},select:{id:true,title:true,companyId:true,status:true,requiresJobReady:true,jobReadyRoleTitle:true,jobReadySeniority:true}});
 if(!job||job.status!=="ACTIVE")throw new ApiError("Active job not found.",404);
 if(session.role!=="ADMIN"){const company=await getSessionCompany(session);if(company.id!==job.companyId)throw new ApiError("Job access denied.",403);}
 const cutoff=new Date(Date.now()-WINDOW*86400000);
 const candidate=await prisma.candidateProfile.findFirst({where:{id:body.candidateProfileId,availabilityStatus:"ACTIVE_CONFIRMED",lastAvailabilityConfirmedAt:{gte:cutoff},...(job.requiresJobReady&&job.jobReadyRoleTitle&&job.jobReadySeniority?{readinessRecords:{some:{roleTitle:job.jobReadyRoleTitle,seniority:job.jobReadySeniority,status:"JOB_READY",OR:[{validUntil:null},{validUntil:{gt:new Date()}}]}}}:{})},select:{id:true,userId:true,user:{select:{name:true}}}});
 if(!candidate)throw new ApiError("Candidate is no longer eligible for proactive sourcing.",409);
 const status=body.action==="INVITE"?"INVITED":"SHORTLISTED";const now=new Date();
 const relationship=await prisma.$transaction(async tx=>{
   const rel=await tx.candidateSourcingRelationship.upsert({where:{jobId_candidateProfileId:{jobId,candidateProfileId:candidate.id}},create:{jobId,candidateProfileId:candidate.id,companyId:job.companyId,sourcedById:session.id,status,...(status==="INVITED"?{invitedAt:now}:{shortlistedAt:now})},update:{status,...(status==="INVITED"?{invitedAt:now}:{shortlistedAt:now})}});
   if(status==="INVITED")await tx.notification.create({data:{userId:candidate.userId,title:"Job invitation from HireGo",message:`An employer invited you to review the ${job.title} opportunity. Open HireGo to review the job before applying.`,type:"JOB_INVITATION"}});
   return rel;
 });
 return NextResponse.json({success:true,relationship:{id:relationship.id,status:relationship.status},candidate:{id:candidate.id,name:candidate.user.name}});
}catch(e){return handleApiError(e)}}
