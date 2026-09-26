import type { Prisma } from "@prisma/client";

type JobClient = Pick<Prisma.TransactionClient, "jobListing">;

export async function reconcileExpiredJobs(db: JobClient, companyId?: string, now = new Date()) {
  return db.jobListing.updateMany({
    where: {
      ...(companyId ? { companyId } : {}),
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: { status: "CLOSED" },
  });
}
