-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

-- Add the receipt review state; existing invoice states and rows are unchanged.
-- Commit this migration before application code writes the new enum value.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
