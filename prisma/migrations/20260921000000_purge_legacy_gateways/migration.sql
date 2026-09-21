-- Additive migration: Purge legacy payment gateway configurations (Razorpay & PhonePe)
-- Migrate to approved production architecture: STRIPE + PAYU only

-- 1. Update PaymentGatewayConfig defaults and current records
ALTER TABLE "PaymentGatewayConfig" ALTER COLUMN "primaryGateway" SET DEFAULT 'STRIPE';

UPDATE "PaymentGatewayConfig"
SET
  "primaryGateway" = 'STRIPE'
WHERE "primaryGateway" IN ('RAZORPAY', 'PHONEPE');

UPDATE "PaymentGatewayConfig"
SET
  "gatewaysStatus" = jsonb_build_object('STRIPE', 'HEALTHY', 'PAYU', 'HEALTHY'),
  "priorities" = jsonb_build_array('STRIPE', 'PAYU')
WHERE id = 'global-gateway-config'
   OR "gatewaysStatus"::text LIKE '%RAZORPAY%'
   OR "gatewaysStatus"::text LIKE '%PHONEPE%'
   OR "priorities"::text LIKE '%RAZORPAY%'
   OR "priorities"::text LIKE '%PHONEPE%';

-- 2. Update PaymentTransaction default provider to STRIPE
ALTER TABLE "PaymentTransaction" ALTER COLUMN "provider" SET DEFAULT 'STRIPE';
