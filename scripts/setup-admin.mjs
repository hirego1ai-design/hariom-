import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.argv[2] || "admin@hirego.ai").toLowerCase().trim();
const rawPassword = process.argv[3] || "Admin@123456";
const name = process.argv[4] || "HireGo Admin";
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({ datasources: url ? { db: { url } } : undefined });

async function main() {
  console.log(`Setting up Admin account for: ${email}`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const admin = await prisma.user.upsert({
        where: { email },
        update: { role: "ADMIN", passwordHash, emailVerified: true, name },
        create: { email, name, role: "ADMIN", passwordHash, emailVerified: true },
      });

      console.log(`\n========================================`);
      console.log(`ADMIN ACCOUNT READY:`);
      console.log(`- Email:    ${admin.email}`);
      console.log(`- Password: ${rawPassword}`);
      console.log(`- Role:     ${admin.role}`);
      console.log(`- Name:     ${admin.name}`);
      console.log(`- Portal:   http://localhost:3000/admin/login`);
      console.log(`========================================\n`);
      return;
    } catch (err) {
      console.log(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main().catch(err => {
  console.error("Failed to setup admin account:", err.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
