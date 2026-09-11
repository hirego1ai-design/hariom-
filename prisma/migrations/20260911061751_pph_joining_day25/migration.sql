-- Additive PPH billing schedule. Existing invoices and agreements are not changed.
CREATE TABLE "PphPlacement" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL,
  "invoiceEligibleAt" TIMESTAMP(3) NOT NULL,
  "approvedBy" TEXT NOT NULL,
  "approvedRole" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "annualCtc" DECIMAL(18,2) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "taxAmount" DECIMAL(18,2) NOT NULL,
  "totalAmount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "creditDays" INTEGER NOT NULL,
  "termsSnapshot" JSONB NOT NULL,
  "requestHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "holdReason" TEXT,
  "invoiceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PphPlacement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PphPlacement_status_check" CHECK ("status" IN ('SCHEDULED','HOLD','CANCELLED','INVOICED')),
  CONSTRAINT "PphPlacement_approval_check" CHECK ("approvedRole" IN ('EMPLOYER','ADMIN')),
  CONSTRAINT "PphPlacement_timing_check" CHECK ("invoiceEligibleAt" = "joinedAt" + INTERVAL '25 days'),
  CONSTRAINT "PphPlacement_amounts_check" CHECK ("annualCtc" > 0 AND "amount" >= 0 AND "taxAmount" >= 0 AND "totalAmount" = "amount" + "taxAmount" AND "creditDays" BETWEEN 0 AND 365),
  CONSTRAINT "PphPlacement_invoice_check" CHECK (("status" = 'INVOICED') = ("invoiceId" IS NOT NULL)),
  CONSTRAINT "PphPlacement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PphPlacement_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommercialAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PphPlacement_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PphPlacement_applicationId_key" ON "PphPlacement"("applicationId");
CREATE UNIQUE INDEX "PphPlacement_invoiceId_key" ON "PphPlacement"("invoiceId");
CREATE INDEX "PphPlacement_status_invoiceEligibleAt_idx" ON "PphPlacement"("status", "invoiceEligibleAt");
CREATE INDEX "PphPlacement_companyId_createdAt_idx" ON "PphPlacement"("companyId", "createdAt");
CREATE INDEX "PphPlacement_agreementId_idx" ON "PphPlacement"("agreementId");
ALTER TABLE "PphPlacement" ENABLE ROW LEVEL SECURITY;
-- Custom JWT / Prisma server-mediated access; no browser policies.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "PphPlacement" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "PphPlacement" FROM authenticated;
  END IF;
END $$;
REVOKE ALL ON TABLE "PphPlacement" FROM PUBLIC;
