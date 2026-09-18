import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE=50, MAX_PAGE_SIZE=100;
const updateSchema=z.object({notificationId:z.string().uuid().optional(),markAll:z.boolean().optional()}).strict().refine(b=>b.markAll===true||Boolean(b.notificationId),"notificationId or markAll is required");
async function requireSession(request:NextRequest){const s=await getCurrentSession(request.headers);if(!s)throw new ApiError("Unauthorized access",401);return s;}

export async function GET(request:NextRequest){
 try{
  await enforceRateLimit(request,"notifications_get",120,60_000);
  const session=await requireSession(request);
  const raw=request.nextUrl.searchParams.get("limit");
  const limit=raw===null?PAGE_SIZE:Number(raw);
  if(!Number.isInteger(limit)||limit<1||limit>MAX_PAGE_SIZE)throw new ApiError(`limit must be between 1 and ${MAX_PAGE_SIZE}.`,400);
  const notifications=await prisma.notification.findMany({where:{userId:session.id},orderBy:{createdAt:"desc"},take:limit});
  const unreadCount=await prisma.notification.count({where:{userId:session.id,isRead:false}});
  return NextResponse.json({success:true,notifications,unreadCount,hasMore:notifications.length===limit});
 }catch(error){return handleApiError(error);}
}
export async function PUT(request:NextRequest){
 try{
  await enforceRateLimit(request,"notifications_update",60,60_000);
  const session=await requireSession(request);
  const body=await readValidatedJson(request,updateSchema);
  const result=await prisma.notification.updateMany({where:body.markAll?{userId:session.id,isRead:false}:{id:body.notificationId,userId:session.id},data:{isRead:true}});
  if(!body.markAll&&result.count!==1)throw new ApiError("Notification not found.",404);
  return NextResponse.json({success:true,updatedCount:result.count});
 }catch(error){return handleApiError(error);}
}
