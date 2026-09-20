import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session=await getCurrentSession(request.headers);
    if(!session||session.role!=="CANDIDATE")throw new ApiError("Candidate access required.",403);
    const candidate=await prisma.candidateProfile.findUnique({where:{userId:session.id},select:{id:true}});
    if(!candidate)throw new ApiError("Candidate profile not found.",404);
    const invitations=await prisma.candidateSourcingRelationship.findMany({
      where:{candidateProfileId:candidate.id,status:{in:["INVITED","ACCEPTED","DECLINED"]}},
      orderBy:{invitedAt:"desc"},
      select:{id:true,status:true,invitedAt:true,acceptedAt:true,declinedAt:true,job:{select:{id:true,title:true,location:true,type:true,company:{select:{name:true}}}}},
    });
    return NextResponse.json({success:true,invitations});
  } catch(error){return handleApiError(error);}
}
