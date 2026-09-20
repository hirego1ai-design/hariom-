import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const noteSchema=z.object({text:z.string().trim().min(1).max(2000)}).strict();
async function context(req:NextRequest,id:string){const s=await getCurrentSession(req.headers);if(!s||!["EMPLOYER","RECRUITER","ADMIN"].includes(s.role))throw new ApiError("Employer access required.",403);const a=await prisma.application.findUnique({where:{id},select:{id:true,job:{select:{companyId:true}}}});if(!a)throw new ApiError("Application not found.",404);if(s.role!=="ADMIN"){const co=await getSessionCompany(s);if(co.id!==a.job.companyId)throw new ApiError("Application access denied.",403);}return{s,companyId:a.job.companyId};}
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await enforceRateLimit(req,"employer_candidate_notes_get",60,60_000);const{id}=await params;await context(req,id);const notes=await prisma.employerCandidateNote.findMany({where:{applicationId:id},select:{id:true,text:true,createdAt:true,author:{select:{name:true}}},orderBy:{createdAt:"desc"}});return NextResponse.json({success:true,notes});}catch(e){return handleApiError(e);}}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await enforceRateLimit(req,"employer_candidate_notes_post",30,60_000);const{id}=await params;const{ s,companyId}=await context(req,id);const body=await readValidatedJson(req,noteSchema,8*1024);const note=await prisma.employerCandidateNote.create({data:{applicationId:id,companyId,authorId:s.id,text:body.text},select:{id:true,text:true,createdAt:true,author:{select:{name:true}}}});await logAuditEvent({userId:s.id,companyId,action:"CANDIDATE_NOTE_CREATED",resource:`Application:${id}`,details:`Note ${note.id} created`,ipAddress:req.headers.get("x-forwarded-for")||undefined});return NextResponse.json({success:true,note},{status:201});}catch(e){return handleApiError(e);}}
