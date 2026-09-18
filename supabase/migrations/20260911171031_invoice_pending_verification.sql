-- Add the receipt review state; existing invoice states and rows are unchanged.
-- Commit this migration before application code writes the new enum value.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
