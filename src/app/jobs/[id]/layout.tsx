import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

async function getPublicJob(id: string) {
  return prisma.jobListing.findFirst({
    where: {
      id,
      status: "ACTIVE",
      publishedAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      type: true,
      workMode: true,
      salaryRange: true,
      publishedAt: true,
      createdAt: true,
      expiresAt: true,
      aiFocusAreas: true,
      company: {
        select: {
          name: true,
          website: true,
          logoUrl: true,
        },
      },
    },
  });
}

function cleanDescription(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJob(id);
  if (!job) {
    return {
      title: "Job Listing | HireGo AI",
      robots: { index: false, follow: true },
    };
  }

  const isQaTest = job.aiFocusAreas === "QA_TEST_PUBLIC_JOB";
  const canonical = `https://www.hiregoai.com/jobs/${job.id}`;
  const companyIsHireGo = job.company.name.trim().toLowerCase() === "hirego ai";
  const title = companyIsHireGo
    ? `${job.title} in ${job.location} | HireGo AI`
    : `${job.title} in ${job.location} | ${job.company.name} | HireGo AI`;
  const description = cleanDescription(job.description);

  return {
    title,
    description,
    alternates: { canonical },
    robots: isQaTest ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "HireGo AI",
      title,
      description,
      url: canonical,
    },
  };
}

export default async function JobDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const job = await getPublicJob(id);

  if (!job || job.aiFocusAreas === "QA_TEST_PUBLIC_JOB") {
    return children;
  }

  const remote = job.workMode.toLowerCase().includes("remote");
  const employmentType = job.type.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.website ? { sameAs: job.company.website } : {}),
      ...(job.company.logoUrl ? { logo: job.company.logoUrl } : {}),
    },
    url: `https://www.hiregoai.com/jobs/${job.id}`,
    ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "India",
          },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location,
              addressCountry: "IN",
            },
          },
        }),
  };

  const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <>
      {children}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </>
  );
}
