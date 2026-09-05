import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/auditLogger";

const joinSchema = z.object({
  applicationId: z.string().min(1),
  agreementId: z.string().min(1),
  idempotencyKey: z.string().min(8, "Idempotency key must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and enforce role-based access control (RBAC)
    const session = await getCurrentSession(req.headers);
    if (!session) {
      throw new ApiError("Unauthorized", 401);
    }

    // Only EMPLOYER (Admin/Owner) or platform ADMIN can create commercial invoices
    if (!["EMPLOYER", "ADMIN"].includes(session.role)) {
      throw new ApiError("Forbidden. Only Company Admins or Platform Admins can finalize joining and generate invoices.", 403);
    }

    await enforceRateLimit(req, "employer_managed_hiring_join", 10, 60000);
    const body = await readValidatedJson(req, joinSchema);

    // 2. Fetch the Application details from server-side database records
    const application = await prisma.application.findUnique({
      where: { id: body.applicationId },
      include: {
        candidateProfile: {
          include: {
            user: true,
          },
        },
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!application) {
      throw new ApiError("Application not found.", 404);
    }

    // Verify company scope
    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });
      if (!profile || profile.companyId !== application.job.companyId) {
        throw new ApiError("Access denied. Candidate is not in your company pipeline.", 403);
      }
    }

    const companyId = application.job.companyId;
    const annualCtc = application.annualCtc;

    // Check if the application contains dynamic annualCtc set by employer/admin
    if (annualCtc === null || annualCtc === undefined) {
      throw new ApiError("Commercial terms (Annual CTC) must be finalized by an authorized company owner before invoice generation.", 400);
    }

    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ applicationId: body.applicationId, agreementId: body.agreementId, annualCtc }))
      .digest("hex");

    // 3. Concurrency-safe idempotency reservation
    try {
      await prisma.idempotencyRecord.create({
        data: {
          companyId,
          idempotencyKey: body.idempotencyKey,
          requestHash,
          status: "PROCESSING",
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        const existing = await prisma.idempotencyRecord.findUnique({
          where: {
            companyId_idempotencyKey: {
              companyId,
              idempotencyKey: body.idempotencyKey,
            },
          },
        });

        if (existing?.status === "SUCCESS") {
          return NextResponse.json({
            success: true,
            duplicate: true,
            invoice: existing.responsePayload,
            message: "Joining event already processed.",
          }, { status: 200 });
        }

        if (existing?.status === "PROCESSING") {
          throw new ApiError("A request with this idempotency key is already in progress. Please retry shortly.", 409);
        }

        if (existing?.status === "FAILED") {
          await prisma.idempotencyRecord.update({
            where: {
              companyId_idempotencyKey: {
                companyId,
                idempotencyKey: body.idempotencyKey,
              },
            },
            data: {
              status: "PROCESSING",
              requestHash,
            },
          });
        } else {
          throw new ApiError("Idempotency conflict. Please use a unique idempotency key.", 409);
        }
      } else {
        throw err;
      }
    }

    // 4. Process business logic inside atomic transaction
    let responsePayload: any;
    try {
      responsePayload = await prisma.$transaction(async (tx) => {
        // Fetch CommercialAgreement and validate
        const agreement = await tx.commercialAgreement.findUnique({
          where: { id: body.agreementId },
        });

        if (!agreement) {
          throw new ApiError("Commercial agreement not found.", 404);
        }

        if (agreement.companyId !== companyId) {
          throw new ApiError("Access denied. Agreement belongs to another company.", 403);
        }

        if (agreement.status !== "ACTIVE") {
          throw new ApiError("Selected commercial agreement is not active.", 400);
        }

        // Calculate fee & tax based on secure database records
        let fee = 0;
        if (agreement.feeType === "PERCENTAGE") {
          fee = (annualCtc * agreement.feeValue) / 100;
        } else {
          fee = agreement.feeValue; // Fixed fee
        }

        const tax = (fee * agreement.taxRatePct) / 100;
        const totalAmount = fee + tax;

        const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const invoiceNumber = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

        // Create invoice record atomically
        const invoice = await tx.invoice.create({
          data: {
            id: invoiceId,
            invoiceNumber,
            agreementId: agreement.id,
            companyName: application.job.company.name,
            candidateName: application.candidateProfile.user?.name || "Candidate",
            jobTitle: application.job.title,
            amount: fee,
            taxAmount: tax,
            totalAmount: totalAmount,
            currency: "INR",
            status: "UNPAID",
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            notes: `Candidate joined. Idempotency key: ${body.idempotencyKey}`,
          },
        });

        // Update application status to HIRED
        await tx.application.update({
          where: { id: application.id },
          data: { status: "HIRED" },
        });

        const payload = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          taxAmount: invoice.taxAmount,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
          dueDate: invoice.dueDate,
        };

        // Mark idempotency record as SUCCESS with response payload
        await tx.idempotencyRecord.update({
          where: {
            companyId_idempotencyKey: {
              companyId,
              idempotencyKey: body.idempotencyKey,
            },
          },
          data: {
            status: "SUCCESS",
            responsePayload: payload as any,
          },
        });

        return { payload, invoiceNumber: invoice.invoiceNumber, candidateName: invoice.candidateName, agreementNumber: agreement.agreementNumber };
      });
    } catch (txError) {
      await prisma.idempotencyRecord.update({
        where: {
          companyId_idempotencyKey: {
            companyId,
            idempotencyKey: body.idempotencyKey,
          },
        },
        data: {
          status: "FAILED",
        },
      }).catch(() => undefined);

      throw txError;
    }

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "INVOICE_GENERATED",
      resource: `Invoice:${responsePayload.payload.id}`,
      details: `Commercial invoice ${responsePayload.invoiceNumber} generated for candidate ${responsePayload.candidateName} on agreement ${responsePayload.agreementNumber}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      success: true,
      duplicate: false,
      invoice: responsePayload.payload,
      message: "Invoice generated successfully",
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
