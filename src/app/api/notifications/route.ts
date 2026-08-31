import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, getCurrentSession, handleApiError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ notificationId: z.string().uuid().optional(), markAll: z.boolean().optional() }).strict().refine((body) => body.markAll === true || Boolean(body.notificationId), "notificationId or markAll is required");

async function requireSession(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session) throw new ApiError("Unauthorized access", 401);
  return session;
}
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const notifications = await prisma.notification.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, notifications, unreadCount: notifications.filter((item) => !item.isRead).length });
  } catch (error) { return handleApiError(error); }
}
export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = await readValidatedJson(request, updateSchema);
    await prisma.notification.updateMany({ where: body.markAll ? { userId: session.id, isRead: false } : { id: body.notificationId, userId: session.id }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  } catch (error) { return handleApiError(error); }
}
