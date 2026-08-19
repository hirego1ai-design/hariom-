import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { invoicesDb } from "@/lib/invoices-db";

const schema = z.object({ applicationId: z.string().min(1), agreementId: z.string().min(1), candidateName: z.string().min(1), jobTitle: z.string().min(1), annualCtc: z.number().positive(), feePercentage: z.number().positive().max(100).default(8.33), taxRatePct: z.number().min(0).max(100).default(18), idempotencyKey: z.string().min(8) });

export async function POST(req: NextRequest) {
  const session = getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const application = await prisma.application.findUnique({ include: { job: { include: { company: true } } }, where: { id: body.applicationId } });
    if (!application) return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    if (session.role !== "ADMIN") { const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } }); if (!profile || profile.companyId !== application.job.companyId) return NextResponse.json({ success: false, error: "Candidate is not in your company pipeline." }, { status: 403 }); }
    const existing = (await invoicesDb.getInvoices()).find(inv => inv.agreementId === body.agreementId && inv.candidateName === body.candidateName && inv.jobTitle === body.jobTitle);
    if (existing) return NextResponse.json({ success: true, duplicate: true, invoice: existing, message: "Joining event already processed." });
    const fee = body.annualCtc * body.feePercentage / 100;
    const tax = fee * body.taxRatePct / 100;
    const invoice = await invoicesDb.createInvoice({ agreementId: body.agreementId, companyName: application.job.company.name, candidateName: body.candidateName, jobTitle: body.jobTitle, amount: fee, taxAmount: tax, totalAmount: fee + tax, currency: "INR", status: "UNPAID", dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), notes: `Candidate joined. Idempotency key: ${body.idempotencyKey}` });
    await prisma.application.update({ where: { id: application.id }, data: { status: "HIRED" } });
    return NextResponse.json({ success: true, invoice, message: "Candidate marked joined and invoice generated." }, { status: 201 });
  } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 }); return NextResponse.json({ success: false, error: "Unable to process joining event." }, { status: 500 }); }
}
