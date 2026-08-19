import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

const allowMockFallbacks = process.env.NODE_ENV !== "production" || process.env.MOCK_DB === "true";

// Fallback in-memory notifications
const inMemoryNotifications: Map<
  string,
  Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  }>
> = new Map();

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
      });

      if (notifications && notifications.length > 0) {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return NextResponse.json({
          success: true,
          notifications,
          unreadCount,
        });
      }
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to load notifications.");
      }
    }

    if (!allowMockFallbacks) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
      });
    }

    // Default seeded notifications for active user if empty
    if (!inMemoryNotifications.has(session.id)) {
      inMemoryNotifications.set(session.id, [
        {
          id: "notif-1",
          title: "Profile AI Score Boost",
          message: "Your resume and verified skills boosted your HireGo score to 92.",
          type: "SUCCESS",
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: "/profile",
        },
        {
          id: "notif-2",
          title: "New Job Recommendations",
          message: "3 new Senior AI Engineer roles match your skill preferences.",
          type: "INFO",
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          actionUrl: "/jobs",
        },
        {
          id: "notif-3",
          title: "Application Received",
          message: "TechCorp Global viewed your application for Staff Frontend Engineer.",
          type: "APPLICATION",
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          actionUrl: "/applications",
        },
      ]);
    }

    const items = inMemoryNotifications.get(session.id) || [];
    const unreadCount = items.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: items,
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    try {
      if (markAll) {
        await prisma.notification.updateMany({
          where: { userId: session.id, isRead: false },
          data: { isRead: true },
        });
      } else if (notificationId) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
      }
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to update notifications.");
      }
      const items = inMemoryNotifications.get(session.id) || [];
      if (markAll) {
        items.forEach((n) => (n.isRead = true));
      } else if (notificationId) {
        const item = items.find((n) => n.id === notificationId);
        if (item) item.isRead = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notifications updated",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
