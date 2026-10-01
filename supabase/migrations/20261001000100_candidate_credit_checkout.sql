CREATE TABLE "CandidateCreditPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateCreditPackage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CandidateCreditPackage_credits_positive" CHECK ("credits" > 0),
    CONSTRAINT "CandidateCreditPackage_price_positive" CHECK ("price" > 0)
);

CREATE UNIQUE INDEX "CandidateCreditPackage_code_key" ON "CandidateCreditPackage"("code");
CREATE INDEX "CandidateCreditPackage_isActive_sortOrder_idx" ON "CandidateCreditPackage"("isActive", "sortOrder");
