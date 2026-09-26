import { PrismaClient, Role, JobStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data for Admin Portal testing...');
  
  // Dummy password hash for 'Password123!'
  const defaultPassword = '$2b$10$0zT0YhQXZy2Z6v1Q8G8oYu/7/G3lF8R9R8q9R8q9R8q9R8q9R8q9O'; // This is just a dummy bcrypt hash structure.

  // 1. Create Companies
  const companies = [];
  for (let i = 1; i <= 5; i++) {
    const company = await prisma.company.create({
      data: {
        name: `TechCorp Innovations ${i}`,
        website: `https://techcorp${i}.example.com`,
        industry: i % 2 === 0 ? 'FinTech' : 'HealthTech',
        size: '50-200',
        location: 'Bangalore, India',
      }
    });
    companies.push(company);
  }
  console.log(`Created 5 test companies.`);

  // 2. Create Employers
  for (let i = 1; i <= 5; i++) {
    const email = `employer${i}@example.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: defaultPassword,
        name: `Employer ${i}`,
        role: Role.EMPLOYER,
        emailVerified: true,
        employerProfile: {
          create: {
            companyId: companies[i - 1].id,
            designation: 'Hiring Manager'
          }
        }
      }
    });
  }
  console.log(`Created 5 test employers.`);

  // 3. Create Candidates
  for (let i = 1; i <= 10; i++) {
    const email = `candidate${i}@example.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: defaultPassword,
        name: `Candidate ${i}`,
        role: Role.CANDIDATE,
        emailVerified: true,
        candidateProfile: {
          create: {
            headline: i % 2 === 0 ? 'Senior Backend Developer' : 'Frontend Engineer',
            bio: 'Experienced software engineer looking for new opportunities.',
            location: 'Remote',
          }
        }
      }
    });
  }
  console.log(`Created 10 test candidates.`);

  // 4. Create Jobs
  for (let i = 1; i <= 15; i++) {
    await prisma.jobListing.create({
      data: {
        companyId: companies[i % 5].id,
        title: `Software Engineer L${(i % 3) + 1}`,
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        salaryRange: '$100k - $150k',
        description: 'We are looking for a talented software engineer to join our fast-growing team.',
        requirements: ['React', 'Node.js', 'PostgreSQL'],
        status: JobStatus.ACTIVE
      }
    });
  }
  console.log(`Created 15 test job listings.`);

  console.log('Test data seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
