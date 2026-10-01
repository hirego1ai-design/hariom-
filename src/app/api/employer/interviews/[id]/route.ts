import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { reconcileCopilotReservation } from "@/lib/copilot/capacity";

const changeSchema = z.object({ action: z.enum(["CANCEL", "RESCHEDULE"]), scheduledAt: z.string().datetime().optional(), reason: z.string().max(500).optional() });

async function authorizedInterview(id: string, session: { id: string; role: string }) {
  const interview = await prisma.interview.findFirst({
    where: {
      id
    },
    include: {
      application: {
        include: {
          job: { include: { company: true } },
          candidateProfile: {
            include: {
              user: true
            }
          }
        }
      },
      roundProgress: { include: { round: { include: { interviewers: true } } } }
    }
  });
  if (!interview) return null;
  if (session.role === "ADMIN") return interview;
  const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await enforceRateLimit(request, "employer_interview_detail", 60, 60_000);
  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const interview = await authorizedInterview(id, session);
    if (!interview) {
      return NextResponse.json({ success: false, error: "Interview not found or access denied." }, { status: 404 });
    }
    const meta = (() => { try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; } catch { return {}; } })();

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        applicationId: interview.applicationId,
        scheduledAt: interview.scheduledAt.toISOString(),
        durationMins: interview.durationMins,
        status: interview.status,
        roomUrl: interview.roomUrl,
        roomId: typeof meta.roomId === "string" ? meta.roomId : null,
        round: typeof meta.round === "string" ? meta.round : "Technical Interview",
        mode: typeof meta.mode === "string" ? meta.mode : interview.roomUrl ? "ONLINE" : "OFFLINE",
        candidateName: interview.application.candidateProfile.user?.name || "Candidate",
        jobTitle: interview.application.job.title,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unable to retrieve interview." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await enforceRateLimit(req, "employer_interview_change", 20, 60_000);
  const session = await getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await readValidatedJson(req, changeSchema, 8 * 1024);
    const interview = await authorizedInterview(id, session);
    if (!interview) return NextResponse.json({ success: false, error: "Interview not found or not accessible." }, { status: 404 });
    if (body.action === "RESCHEDULE" && !body.scheduledAt) return NextResponse.json({ success: false, error: "New date and time are required." }, { status: 400 });
    if (body.action === "RESCHEDULE" && new Date(body.scheduledAt!).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "New interview date and time must be in the future." }, { status: 400 });
    }
    if (interview.application.status !== "AI_INTERVIEW") {
      return NextResponse.json(
        { success: false, error: "This application is no longer in the active interview workflow." },
        { status: 409 },
      );
    }
    if (["COMPLETED", "FEEDBACK_SUBMITTED"].includes(interview.status)) {
      return NextResponse.json({ success: false, error: "A completed interview cannot be cancelled or rescheduled." }, { status: 409 });
    }
    if (interview.status === "LIVE" && body.action === "RESCHEDULE") {
      return NextResponse.json(
        { success: false, error: "A live interview cannot be rescheduled. End or cancel the active room first." },
        { status: 409 },
      );
    }
    if (interview.status === "CANCELLED" && body.action === "CANCEL") {
      return NextResponse.json({ success: true, interview: { id: interview.id, status: interview.status, scheduledAt: interview.scheduledAt }, idempotent: true });
    }
    if (interview.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "A cancelled interview must be scheduled as a new interview." }, { status: 409 });
    }
    const currentMeta = (() => { try { return interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {}; } catch { return {}; } })();
    const nextStatus = body.action === "CANCEL" ? "CANCELLED" : "RESCHEDULED";
    const nextScheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : interview.scheduledAt;

    const changeResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${interview.applicationId} FOR UPDATE`;
      const lockedApplication = await tx.application.findUnique({
        where: { id: interview.applicationId },
        select: { status: true },
      });
      if (!lockedApplication || lockedApplication.status !== "AI_INTERVIEW") {
        throw new ApiError(
          "Application left the active interview workflow before this change could be saved.",
          409,
        );
      }

      await tx.$queryRaw`SELECT id FROM "Interview" WHERE id = ${interview.id} FOR UPDATE`;
      const lockedInterview = await tx.interview.findUnique({
        where: { id: interview.id },
        select: { status: true, scheduledAt: true },
      });
      if (!lockedInterview) throw new ApiError("Interview not found.", 404);
      if (["COMPLETED", "FEEDBACK_SUBMITTED"].includes(lockedInterview.status)) {
        throw new ApiError(
          "Interview completed before this change could be saved.",
          409,
        );
      }
      if (lockedInterview.status === "CANCELLED") {
        if (body.action === "CANCEL") {
          const row = await tx.interview.findUniqueOrThrow({ where: { id: interview.id } });
          return { interview: row, changed: false };
        }
        throw new ApiError(
          "A cancelled interview must be scheduled as a new interview.",
          409,
        );
      }
      if (lockedInterview.status === "LIVE" && body.action === "RESCHEDULE") {
        throw new ApiError(
          "A live interview cannot be rescheduled. End or cancel the active room first.",
          409,
        );
      }

      if (body.action === "RESCHEDULE") {
        const participantIds = [
          interview.application.candidateProfile.userId,
          ...(interview.roundProgress?.round.interviewers.map((item) => item.userId) || []),
        ].sort();
        for (const participantId of participantIds) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`hirego:interview-participant:${participantId}`}))`;
        }
        const end = new Date(nextScheduledAt.getTime() + interview.durationMins * 60_000);
        const possible = await tx.interview.findMany({
          where: {
            id: { not: interview.id },
            status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] },
            scheduledAt: { gte: new Date(nextScheduledAt.getTime() - 4 * 60 * 60_000), lt: end },
          },
          include: {
            application: { include: { candidateProfile: { select: { userId: true } } } },
            roundProgress: { include: { round: { include: { interviewers: { select: { userId: true } } } } } },
          },
        });
        const requested = new Set(participantIds);
        const conflict = possible.find((existing) => {
          const existingEnd = new Date(existing.scheduledAt.getTime() + existing.durationMins * 60_000);
          if (!(existing.scheduledAt < end && existingEnd > nextScheduledAt)) return false;
          return [
            existing.application.candidateProfile.userId,
            ...(existing.roundProgress?.round.interviewers.map((item) => item.userId) || []),
          ].some((participantId) => requested.has(participantId));
        });
        if (conflict) throw new Error("INTERVIEW_TIME_CONFLICT");
      }

      const row = await tx.interview.update({
        where: { id: interview.id },
        data: {
          status: nextStatus,
          scheduledAt: nextScheduledAt,
          aiFeedback: JSON.stringify({ ...currentMeta, changeReason: body.reason || null, changedAt: new Date().toISOString() }),
        },
      });
      if (body.action === "CANCEL" && interview.roundProgress) {
        const cancelledProgress = await tx.interviewRoundProgress.updateMany({
          where: {
            id: interview.roundProgress.id,
            interviewId: interview.id,
            status: { in: ["PENDING", "SCHEDULED", "LIVE", "ON_HOLD"] },
          },
          data: { status: "CANCELLED", interviewId: null },
        });
        if (cancelledProgress.count !== 1) {
          throw new ApiError(
            "Interview round state changed before cancellation could be saved.",
            409,
          );
        }
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: interview.application.job.companyId,
          action: body.action === "CANCEL" ? "INTERVIEW_CANCELLED" : "INTERVIEW_RESCHEDULED",
          resource: `Interview:${interview.id}`,
          ipAddress: req.headers.get("x-forwarded-for") || undefined,
          details: JSON.stringify({
            applicationId: interview.applicationId,
            previousStatus: lockedInterview.status,
            nextStatus: row.status,
            previousScheduledAt: lockedInterview.scheduledAt.toISOString(),
            scheduledAt: row.scheduledAt.toISOString(),
            reason: body.reason || null,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return { interview: row, changed: true };
    });

    const updated = changeResult.interview;
    if (!changeResult.changed) {
      return NextResponse.json({
        success: true,
        interview: { id: updated.id, status: updated.status, scheduledAt: updated.scheduledAt },
        idempotent: true,
        message: "Interview was already cancelled.",
      });
    }

    if (body.action === "CANCEL" && updated.startedAt) {
      const cancelledAt = new Date();
      const actualMinutes = Math.max(
        1,
        Math.ceil((cancelledAt.getTime() - updated.startedAt.getTime()) / 60_000),
      );
      const reservations = await prisma.copilotUsageReservation.findMany({
        where: {
          companyId: interview.application.job.companyId,
          interviewId: interview.id,
          idempotencyKey: {
            in: [
              `live-interview:${interview.id}:video`,
              `live-interview:${interview.id}:proctoring`,
            ],
          },
        },
      });
      for (const reservation of reservations) {
        try {
          await reconcileCopilotReservation({
            reservationId: reservation.id,
            actualQuantity:
              reservation.actionKey === "VIDEO_INTERVIEW_MINUTE"
                ? actualMinutes
                : 1,
            allowOverage: true,
            metadata: {
              scheduledDurationMins: interview.durationMins,
              actualDurationMins: actualMinutes,
              cancelledAt: cancelledAt.toISOString(),
              lifecycleOutcome: "INTERVIEW_CANCELLED",
            },
          });
        } catch (meterError) {
          await prisma.auditLog.create({
            data: {
              companyId: interview.application.job.companyId,
              action: "COPILOT_USAGE_RECONCILIATION_FAILED",
              resource: `Interview:${interview.id}`,
              details:
                meterError instanceof Error
                  ? meterError.message.slice(0, 500)
                  : "Unknown metering reconciliation failure after cancellation",
            },
          }).catch(() => undefined);
        }
      }
    }

    const candidate = interview.application.candidateProfile.user;
    const eventKey = body.action === "CANCEL" ? "INTERVIEW_CANCELLED" : "INTERVIEW_RESCHEDULED";
    const variables: Record<string, string | number | boolean | null> = body.action === "CANCEL"
      ? {
          candidate_name: candidate?.name || "Candidate",
          company_name: interview.application.job.company.name,
          job_title: interview.application.job.title,
        }
      : {
          candidate_name: candidate?.name || "Candidate",
          company_name: interview.application.job.company.name,
          job_title: interview.application.job.title,
          interview_date: nextScheduledAt.toISOString().slice(0, 10),
          interview_time: nextScheduledAt.toISOString().slice(11, 16),
          timezone: "UTC",
        };
    const email = !candidate?.email
      ? { status: "MISSING_RECIPIENT" as const }
      : await dispatchCommunication({
          eventKey,
          channel: "EMAIL",
          audience: "CANDIDATE",
          recipient: candidate.email,
          variables,
          idempotencyKey: `interview:${interview.id}:${body.action.toLowerCase()}:candidate:email:${nextScheduledAt.toISOString()}`,
          correlationId: interview.id,
          recipientRef: interview.application.candidateProfile.userId,
        }).then((delivery) => ({ status: delivery.status, deliveryId: delivery.id })).catch((error) => ({ status: "FAILED", error: error instanceof Error ? error.message : "Email dispatch failed." }));

    return NextResponse.json({
      success: true,
      interview: { id: updated.id, status: updated.status, scheduledAt: updated.scheduledAt },
      notifications: { email },
      message: `Interview ${body.action.toLowerCase()}d successfully.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INTERVIEW_TIME_CONFLICT") {
      return NextResponse.json({ success: false, error: "The candidate or an assigned interviewer already has an overlapping interview." }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return handleApiError(error);
  }
}
