-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "gateway" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayTxId" TEXT,
    "promoCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_orderId_key" ON "PaymentOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_gatewayOrderId_key" ON "PaymentOrder"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_companyId_idx" ON "PaymentOrder"("companyId");

-- CreateIndex
CREATE INDEX "PaymentOrder_gatewayOrderId_idx" ON "PaymentOrder"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_gatewayTxId_idx" ON "PaymentOrder"("gatewayTxId");
