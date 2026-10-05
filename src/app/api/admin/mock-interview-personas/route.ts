import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const updateSchema = z
  .object({
    personaId: z.string().uuid(),
    displayName: z.string().trim().min(1).max(80).optional(),
    voiceKey: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/)
      .nullable()
      .optional(),
    tone: z.string().trim().min(3).max(500).optional(),
    isActive: z.boolean().optional(),
    reason: z.string().trim().min(3).max(500),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.displayName === undefined &&
      value.voiceKey === undefined &&
      value.tone === undefined &&
      value.isActive === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personaId"],
        message: "At least one persona field must change.",
      });
    }
  });

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_mock_personas_read:${admin.id}`,
      60,
      60_000,
    );

    const personas = await prisma.mockInterviewPersona.findMany({
      orderBy: [{ roleFamily: "asc" }, { displayName: "asc" }],
      select: {
        id: true,
        key: true,
        roleFamily: true,
        displayName: true,
        voiceKey: true,
        tone: true,
        questionMethodology: true,
        competencyDimensions: true,
        rubricVersion: true,
        isActive: true,
        updatedAt: true,
        _count: { select: { sessions: true } },
      },
    });

    return NextResponse.json({
      success: true,
      personas: personas.map((persona) => ({
        ...persona,
        sessionCount: persona._count.sessions,
        _count: undefined,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_mock_personas_write:${admin.id}`,
      20,
      60_000,
    );
    const body = await readValidatedJson(request, updateSchema, 16 * 1024);

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.mockInterviewPersona.findUnique({
        where: { id: body.personaId },
      });
      if (!previous) {
        throw new ApiError("Mock Interview persona not found.", 404);
      }

      const persona = await tx.mockInterviewPersona.update({
        where: { id: body.personaId },
        data: {
          ...(body.displayName !== undefined
            ? { displayName: body.displayName }
            : {}),
          ...(body.voiceKey !== undefined
            ? { voiceKey: body.voiceKey }
            : {}),
          ...(body.tone !== undefined ? { tone: body.tone } : {}),
          ...(body.isActive !== undefined
            ? { isActive: body.isActive }
            : {}),
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "MOCK_INTERVIEW_PERSONA_UPDATED",
          resource: `MockInterviewPersona:${previous.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            reason: body.reason,
            before: {
              displayName: previous.displayName,
              voiceKey: previous.voiceKey,
              tone: previous.tone,
              rubricVersion: previous.rubricVersion,
              isActive: previous.isActive,
            },
            after: {
              displayName: persona.displayName,
              voiceKey: persona.voiceKey,
              tone: persona.tone,
              rubricVersion: persona.rubricVersion,
              isActive: persona.isActive,
            },
          }),
        },
      });

      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);
      return persona;
    });

    return NextResponse.json({
      success: true,
      persona: {
        id: updated.id,
        key: updated.key,
        roleFamily: updated.roleFamily,
        displayName: updated.displayName,
        voiceKey: updated.voiceKey,
        tone: updated.tone,
        rubricVersion: updated.rubricVersion,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
