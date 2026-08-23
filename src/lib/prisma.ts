import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./auth";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProduction = process.env.NODE_ENV === "production";
if (isProduction && process.env.MOCK_DB === "true") {
  throw new Error("FATAL: MOCK_DB cannot be enabled in production. This is a critical configuration error.");
}
const allowMockFallbacks = !isProduction || process.env.MOCK_DB === "true";

const createMockPrisma = () => {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === '$connect' || prop === '$disconnect' || prop === '$transaction') {
        return async () => { throw new Error('Mock DB Offline'); };
      }
      return new Proxy({}, {
        get(target2, prop2) {
          return async () => {
            throw new Error(`Mock DB Offline: ${String(prop)}.${String(prop2)}`);
          };
        }
      });
    }
  }) as unknown as PrismaClient;
};

export const prisma = process.env.MOCK_DB === "true" 
  ? createMockPrisma()
  : (globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }));

if (process.env.NODE_ENV !== "production" && process.env.MOCK_DB !== "true") {
  globalForPrisma.prisma = prisma;
}

// Seed Mock Users
const mockUsers = [
  {
    id: "user-admin-1",
    email: "admin@hirego.ai",
    name: "HireGo Admin",
    passwordHash: hashPassword("Admin123!@#"),
    role: "ADMIN" as const,
  },
  {
    id: "user-employer-1",
    email: "employer@company.com",
    name: "Acme Corp Recruiter",
    passwordHash: hashPassword("Employer123!@#"),
    role: "EMPLOYER" as const,
  },
  {
    id: "user-candidate-1",
    email: "candidate@gmail.com",
    name: "Rohit Kumar",
    passwordHash: hashPassword("Candidate123!@#"),
    role: "CANDIDATE" as const,
  },
];

// Seed Mock Jobs
const mockJobs: any[] = [
  {
    id: "job-101",
    title: "Senior Full Stack AI Engineer",
    company: "Acme Corporation",
    location: "Bangalore / Remote",
    type: "Full-time",
    salary: "₹25L - ₹35L",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    id: "job-102",
    title: "Lead Prompt & LLM Architect",
    company: "HireGo Enterprise",
    location: "Mumbai",
    type: "Full-time",
    salary: "₹30L - ₹45L",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
];

export const db = {
  async findUserByEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) return user;
    } catch (error) {
      if (allowMockFallbacks) {
        return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
      }
      throw error;
    }
    if (allowMockFallbacks) {
      return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    return null;
  },

  async createUser(data: { email: string; name: string; passwordHash: string; role: any }) {
    try {
      const user = await prisma.user.create({ data });
      return user;
    } catch (error) {
      if (!allowMockFallbacks) {
        throw error;
      }
      const newUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role,
      };
      mockUsers.push(newUser);
      return newUser;
    }
  },

  async getJobs() {
    try {
      const jobs = await prisma.jobListing.findMany();
      if (jobs && jobs.length > 0) return jobs;
      if (allowMockFallbacks) return mockJobs;
      return jobs ?? [];
    } catch (error) {
      if (allowMockFallbacks) {
        return mockJobs;
      }
      throw error;
    }
  },

  async createJob(data: { title: string; company: string; location: string; type: string; salary: string; status: string; companyId: string }) {
    try {
      const job = await prisma.jobListing.create({
        data: {
          title: data.title,
          companyId: data.companyId,
          location: data.location,
          type: data.type,
          salaryRange: data.salary,
          description: `Job listing for ${data.title} at ${data.company}`,
          status: data.status as any,
          requirements: ["TypeScript", "Next.js", "AI Integrations"],
        },
      });
      return job;
    } catch (error) {
      if (isProduction) {
        throw error;
      }
      const newJob = {
        id: `job-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      mockJobs.unshift(newJob);
      return newJob;
    }
  },
};

export default prisma;
