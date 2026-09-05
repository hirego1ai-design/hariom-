import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TestResult } from "./suite.test";
import { GET as getInvoicesHandler } from "@/app/api/employer/billing/invoices/route";
import { POST as payInvoiceHandler } from "@/app/api/employer/billing/invoices/[id]/pay/route";
import { POST as receiptInvoiceHandler } from "@/app/api/employer/billing/invoices/[id]/receipt/route";
import { GET as getFileHandler } from "@/app/api/files/[id]/route";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function runBillingInvoicesTests(): Promise<{
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    if (condition) {
      passed++;
      results.push({ name, category: "Billing Invoices", passed: true, message: `PASS: ${message}` });
    } else {
      failed++;
      results.push({ name, category: "Billing Invoices", passed: false, message: `FAIL: ${message}` });
    }
  };

  // Check database connectivity
  let dbAvailable = false;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbAvailable = true;
  } catch {
    if (process.env.HIREGO_TEST_DATABASE !== "1") {
      results.push({
        name: "Billing invoices integration suite",
        category: "Billing Invoices",
        passed: false,
        skipped: true,
        message: "SKIPPED outside CI: database unavailable (set HIREGO_TEST_DATABASE=1)",
      });
      return { passed, failed, results };
    }
  }

  if (dbAvailable) {
    const testId = crypto.randomUUID().slice(0, 8);

    // Helpers to call API endpoints
    const callGetInvoices = async (sessionToken: string, companyIdQuery?: string) => {
      const url = `http://localhost/api/employer/billing/invoices${companyIdQuery ? `?companyId=${companyIdQuery}` : ""}`;
      const req = new NextRequest(url, {
        method: "GET",
        headers: { authorization: `Bearer ${sessionToken}` },
      });
      const res = await getInvoicesHandler(req);
      const json = await res.json();
      return { status: res.status, json };
    };

    const callPayInvoice = async (sessionToken: string, invoiceId: string) => {
      const req = new NextRequest(`http://localhost/api/employer/billing/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionToken}` },
      });
      const res = await payInvoiceHandler(req, { params: Promise.resolve({ id: invoiceId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    const callReceiptInvoice = async (sessionToken: string, invoiceId: string, body: any) => {
      const req = new NextRequest(`http://localhost/api/employer/billing/invoices/${invoiceId}/receipt`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      });
      const res = await receiptInvoiceHandler(req, { params: Promise.resolve({ id: invoiceId }) });
      const json = await res.json();
      return { status: res.status, json };
    };

    const callGetFile = async (sessionToken: string, fileId: string) => {
      const req = new NextRequest(`http://localhost/api/files/${fileId}`, {
        method: "GET",
        headers: { authorization: `Bearer ${sessionToken}` },
      });
      const res = await getFileHandler(req, { params: Promise.resolve({ id: fileId }) });
      return { status: res.status };
    };

    let companyA: any = null;
    let companyB: any = null;
    let employerA: any = null;
    let recruiterA: any = null;
    let employerB: any = null;
    let agreementA: any = null;
    let agreementB: any = null;
    let invoiceA: any = null;
    let invoiceB: any = null;

    try {
      // Setup Companies
      companyA = await prisma.company.create({ data: { name: `Company A ${testId}` } });
      companyB = await prisma.company.create({ data: { name: `Company B ${testId}` } });

      // Users & Profiles
      employerA = await prisma.user.create({
        data: { email: `employer-a-${testId}@hirego.test`, name: "Employer A", passwordHash: "d", role: "EMPLOYER" },
      });
      await prisma.employerProfile.create({ data: { userId: employerA.id, companyId: companyA.id } });

      recruiterA = await prisma.user.create({
        data: { email: `recruiter-a-${testId}@hirego.test`, name: "Recruiter A", passwordHash: "d", role: "RECRUITER" },
      });
      await prisma.employerProfile.create({ data: { userId: recruiterA.id, companyId: companyA.id } });

      employerB = await prisma.user.create({
        data: { email: `employer-b-${testId}@hirego.test`, name: "Employer B", passwordHash: "d", role: "EMPLOYER" },
      });
      await prisma.employerProfile.create({ data: { userId: employerB.id, companyId: companyB.id } });

      // Agreements
      agreementA = await prisma.commercialAgreement.create({
        data: {
          agreementNumber: `AGR-A-${testId}`,
          companyId: companyA.id,
          companyName: companyA.name,
          clientLegalName: companyA.name,
          contactPerson: "Contact",
          clientEmail: "a@hirego.test",
          clientPhone: "1",
          validityEndDate: new Date(Date.now() + 86400000),
          status: "ACTIVE",
        },
      });

      agreementB = await prisma.commercialAgreement.create({
        data: {
          agreementNumber: `AGR-B-${testId}`,
          companyId: companyB.id,
          companyName: companyB.name,
          clientLegalName: companyB.name,
          contactPerson: "Contact",
          clientEmail: "b@hirego.test",
          clientPhone: "1",
          validityEndDate: new Date(Date.now() + 86400000),
          status: "ACTIVE",
        },
      });

      // Invoices
      invoiceA = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-A-${testId}`,
          agreementId: agreementA.id,
          companyName: companyA.name,
          candidateName: "Candidate A",
          jobTitle: "Role A",
          amount: 10000,
          taxAmount: 1800,
          totalAmount: 11800,
          dueDate: "2026-09-30",
          status: "UNPAID",
        },
      });

      invoiceB = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-B-${testId}`,
          agreementId: agreementB.id,
          companyName: companyB.name,
          candidateName: "Candidate B",
          jobTitle: "Role B",
          amount: 20000,
          taxAmount: 3600,
          totalAmount: 23600,
          dueDate: "2026-09-30",
          status: "UNPAID",
        },
      });

      const tokenEmployerA = createSessionToken({
        id: employerA.id,
        email: employerA.email,
        name: employerA.name,
        role: "EMPLOYER",
        sessionVersion: 0,
      });

      const tokenRecruiterA = createSessionToken({
        id: recruiterA.id,
        email: recruiterA.email,
        name: recruiterA.name,
        role: "RECRUITER",
        sessionVersion: 0,
      });

      const tokenEmployerB = createSessionToken({
        id: employerB.id,
        email: employerB.email,
        name: employerB.name,
        role: "EMPLOYER",
        sessionVersion: 0,
      });

      // --- Scenario 1: RBAC Access Control ---
      const resGetRecruiter = await callGetInvoices(tokenRecruiterA);
      const resPayRecruiter = await callPayInvoice(tokenRecruiterA, invoiceA.id);
      
      assert(
        "Billing access controls reject non-employer role",
        resGetRecruiter.status === 403 && resPayRecruiter.status === 403,
        "Recruiter role correctly rejected with 403 Forbidden"
      );

      // --- Scenario 2: Invoice list scoping ---
      const resGetEmployerA = await callGetInvoices(tokenEmployerA);
      const invoicesA = resGetEmployerA.json.invoices || [];
      const containsInvoiceA = invoicesA.some((i: any) => i.id === invoiceA.id);
      const containsInvoiceB = invoicesA.some((i: any) => i.id === invoiceB.id);

      assert(
        "Employer invoice list is strictly company-scoped",
        resGetEmployerA.status === 200 && containsInvoiceA && !containsInvoiceB,
        "Employer A only sees invoices belonging to Company A"
      );

      // --- Scenario 3: Pay Invoice cross-company protection ---
      const resPayCross = await callPayInvoice(tokenEmployerA, invoiceB.id); // Employer A paying Company B's invoice
      assert(
        "Paying other company's invoice is blocked",
        resPayCross.status === 403 && resPayCross.json.error.includes("Access denied"),
        "Cross-company payment request rejected"
      );

      // --- Scenario 4: Direct pay endpoint rejection (Online payment unconfigured) ---
      const resPaySuccess = await callPayInvoice(tokenEmployerA, invoiceA.id);
      const dbInvoiceA = await prisma.invoice.findUnique({ where: { id: invoiceA.id } });
      assert(
        "Direct online payment rejected with 503 when gateway is unconfigured",
        resPaySuccess.status === 503 && dbInvoiceA?.status === "UNPAID",
        "Direct endpoint refused payment execution and invoice remained UNPAID"
      );

      // --- Scenario 5: Submit receipt RBAC and scoping ---
      const dummyPngBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      const utrRef = "UTR-A-NEFT-9090";

      // 5a: Recruiter upload must be rejected with 403
      const resReceiptRecruiter = await callReceiptInvoice(tokenRecruiterA, invoiceA.id, {
        bankTransferRef: utrRef,
        bankTransferReceiptUrl: dummyPngBase64,
      });
      assert(
        "Receipt upload rejected for recruiter role",
        resReceiptRecruiter.status === 403,
        "Recruiter upload correctly blocked with 403 Forbidden"
      );

      // 5b: Cross-company employer upload must be rejected with 403
      const resReceiptCross = await callReceiptInvoice(tokenEmployerB, invoiceA.id, {
        bankTransferRef: utrRef,
        bankTransferReceiptUrl: dummyPngBase64,
      });
      assert(
        "Receipt upload rejected for cross-company employer",
        resReceiptCross.status === 403,
        "Cross-company employer upload correctly blocked with 403"
      );

      // --- Scenario 6: Production Storage Fail-Closed Validation (503 when S3 unconfigured) ---
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = "production";
        const resReceiptProdMissingConfig = await callReceiptInvoice(tokenEmployerA, invoiceA.id, {
          bankTransferRef: utrRef,
          bankTransferReceiptUrl: dummyPngBase64,
        });

        const dbInvoiceDuringFailClosed = await prisma.invoice.findUnique({ where: { id: invoiceA.id } });

        assert(
          "Production mode fails closed with 503 when S3 credentials are not configured and keeps invoice UNPAID",
          resReceiptProdMissingConfig.status === 503 && dbInvoiceDuringFailClosed?.status === "UNPAID",
          "Production storage fail-closed verified (status 503, invoice status remained UNPAID)"
        );
      } finally {
        (process.env as any).NODE_ENV = originalNodeEnv;
      }

      // --- Scenario 7: Successful controlled dev upload with StoredFile & private storage ---
      const resReceipt = await callReceiptInvoice(tokenEmployerA, invoiceA.id, {
        bankTransferRef: utrRef,
        bankTransferReceiptUrl: dummyPngBase64,
      });

      const dbInvoiceAfterReceipt = await prisma.invoice.findUnique({ where: { id: invoiceA.id } });
      
      let parsedNotes: any = {};
      if (dbInvoiceAfterReceipt?.notes) {
        try {
          parsedNotes = JSON.parse(dbInvoiceAfterReceipt.notes);
        } catch {}
      }

      // Check if file exists in dev private storage
      let fileExistsOnDisk = false;
      let storedFileRecord: any = null;

      if (parsedNotes.bankTransferReceiptUrl) {
        const devStoragePath = path.resolve(process.cwd(), ".data", "private-uploads", parsedNotes.bankTransferReceiptUrl);
        fileExistsOnDisk = fs.existsSync(devStoragePath);
        
        storedFileRecord = await prisma.storedFile.findFirst({
          where: { objectKey: parsedNotes.bankTransferReceiptUrl },
        });

        // Cleanup local file
        if (fileExistsOnDisk) {
          fs.unlinkSync(devStoragePath);
        }
      }

      // Verify that the receipt is not exposed via a public URL
      const isPublicUrl = typeof parsedNotes.bankTransferReceiptUrl === "string" && (
        parsedNotes.bankTransferReceiptUrl.startsWith("http://") || 
        parsedNotes.bankTransferReceiptUrl.startsWith("https://")
      );

      assert(
        "Receipt upload writes to secure private storage, populates StoredFile, and is not exposed publicly",
        resReceipt.status === 200 &&
        (dbInvoiceAfterReceipt?.status as any) === "PENDING_VERIFICATION" &&
        parsedNotes.bankTransferRef === utrRef &&
        fileExistsOnDisk &&
        storedFileRecord !== null &&
        storedFileRecord.category === "PAYMENT_RECEIPT" &&
        !isPublicUrl,
        "Private file verified, database metadata logged, not publicly exposed, and status set to PENDING_VERIFICATION"
      );

      // --- Scenario 8: Verify private file access controls (/api/files/[id]) ---
      const testStoredFile = await prisma.storedFile.create({
        data: {
          ownerId: employerA.id,
          companyId: companyA.id,
          objectKey: `test-receipts/probe-${testId}.png`,
          category: "PAYMENT_RECEIPT",
          originalName: "test-receipt.png",
          mimeType: "image/png",
          sizeBytes: 100,
        },
      });

      // 8a: Cross-company employer B should receive 403
      const resFileCross = await callGetFile(tokenEmployerB, testStoredFile.id);
      assert(
        "File access rejected for cross-company employer",
        resFileCross.status === 403,
        "Cross-company file access correctly denied with 403"
      );

      // 8b: Company owner employer A should be allowed (status 200 or 307)
      const resFileOwner = await callGetFile(tokenEmployerA, testStoredFile.id);
      const isAllowedStatus = resFileOwner.status === 200 || resFileOwner.status === 307;
      assert(
        "File access permitted for authorized company owner",
        isAllowedStatus,
        `Authorized file access returned status ${resFileOwner.status}`
      );

      // Cleanup StoredFiles created by test
      if (storedFileRecord) {
        await prisma.storedFile.delete({ where: { id: storedFileRecord.id } }).catch(() => undefined);
      }
      await prisma.storedFile.delete({ where: { id: testStoredFile.id } }).catch(() => undefined);

      // Final Cleanup
      await prisma.invoice.deleteMany({ where: { id: { in: [invoiceA.id, invoiceB.id] } } }).catch(() => undefined);
      await prisma.commercialAgreement.deleteMany({ where: { id: { in: [agreementA.id, agreementB.id] } } }).catch(() => undefined);
      await prisma.employerProfile.deleteMany({ where: { userId: { in: [employerA.id, recruiterA.id, employerB.id] } } }).catch(() => undefined);
      await prisma.user.deleteMany({ where: { id: { in: [employerA.id, recruiterA.id, employerB.id] } } }).catch(() => undefined);
      await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } }).catch(() => undefined);

    } catch (err: any) {
      assert("Billing invoices integration tests execution", false, err.message || String(err));
    }
  }

  return { passed, failed, results };
}
