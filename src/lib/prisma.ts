import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (process.env.MOCK_DB === "true") {
  throw new Error("FATAL: MOCK_DB is not supported by the application runtime. Use isolated test fixtures instead.");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: process.env.DATABASE_URL,
          },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Compatibility wrapper used by existing route handlers.
 * All methods are authoritative database operations: there are no mock users,
 * jobs, passwords, or in-memory persistence fallbacks in application code.
 */
export const db = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  },

  createUser(data: { email: string; name: string; passwordHash: string; role: any }) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim(),
      },
    });
  },

  getJobs() {
    return prisma.jobListing.findMany();
  },

  createJob(data: {
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    status: string;
    companyId: string;
  }) {
    return prisma.jobListing.create({
      data: {
        title: data.title,
        companyId: data.companyId,
        location: data.location,
        type: data.type,
        salaryRange: data.salary,
        description: `Job listing for ${data.title} at ${data.company}`,
        status: data.status as any,
        requirements: [],
      },
    });
  },
};

export default prisma;
