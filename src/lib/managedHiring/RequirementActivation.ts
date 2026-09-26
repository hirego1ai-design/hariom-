import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";
import { OutboxPublisher } from "@/lib/events/Outbox";

type ManagedPosition = {
  jobTitle: string;
  numberOfPositions: number;
  experienceYears: string;
  workMode: string;
  location: string;
};

function bounded(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function roleKey(title: string, occurrence: number): string {
  const base = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "role";
  return `${base}-${occurrence}`;
}

function parsePositions(requirement: {
  positions: unknown;
  jobTitles: string[];
  numberOfPositions: number;
  experienceYears: string;
  workMode: string;
  location: string;
}): ManagedPosition[] {
  if (Array.isArray(requirement.positions)) {
    const parsed = requirement.positions
      .map((item): ManagedPosition | null => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const row = item as Record<string, unknown>;
        const jobTitle = bounded(row.jobTitle, 200);
        const experienceYears = bounded(row.experienceYears, 500);
        const workMode = bounded(row.workMode, 100);
        const location = bounded(row.location, 500);
        const numberOfPositions = Number(row.numberOfPositions);
        if (
          !jobTitle ||
          !experienceYears ||
          !workMode ||
          !location ||
          !Number.isInteger(numberOfPositions) ||
          numberOfPositions < 1
        ) return null;
        return { jobTitle, experienceYears, workMode, location, numberOfPositions };
      })
      .filter((item): item is ManagedPosition => Boolean(item));
    if (parsed.length > 0) return parsed;
  }

  const titles = requirement.jobTitles.map((title) => title.trim()).filter(Boolean);
  return titles.map((jobTitle, index) => ({
    jobTitle,
    numberOfPositions:
      titles.length === 1
        ? Math.max(1, requirement.numberOfPositions)
        : 1,
    experienceYears: requirement.experienceYears.trim(),
    workMode: requirement.workMode.trim(),
    location: requirement.location.trim(),
  }));
}

function descriptionFor(
  requirement: {
    department: string | null;
    education: string;
    certifications: string | null;
    languages: string | null;
    tools: string | null;
    noticePeriod: string | null;
    joiningTimeline: string;
    additionalNotes: string | null;
  },
  position: ManagedPosition,
): string {
  const lines = [
    `Role: ${position.jobTitle}`,
    `Open positions: ${position.numberOfPositions}`,
    requirement.department ? `Department: ${requirement.department}` : null,
    `Experience requirement: ${position.experienceYears}`,
    `Location: ${position.location}`,
    `Work mode: ${position.workMode}`,
    `Education: ${requirement.education}`,
    requirement.certifications ? `Certifications: ${requirement.certifications}` : null,
    requirement.languages ? `Languages: ${requirement.languages}` : null,
    requirement.tools ? `Tools: ${requirement.tools}` : null,
    requirement.noticePeriod ? `Notice period: ${requirement.noticePeriod}` : null,
    `Joining timeline: ${requirement.joiningTimeline}`,
    requirement.additionalNotes ? `Additional notes: ${requirement.additionalNotes}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.join("\n");
}

export async function activateManagedHiringRequirement(params: {
  requirementId: string;
  activeAgreementId?: string;
  assignedSalesLead?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "HiringRequirement" WHERE id = ${params.requirementId} FOR UPDATE`;

    const requirement = await tx.hiringRequirement.findUnique({
      where: { id: params.requirementId },
    });
    if (!requirement) throw new ApiError("Requirement not found.", 404);
    if (!requirement.companyId) {
      throw new ApiError("Managed hiring requirement must be linked to a company before activation.", 409);
    }
    if (!requirement.employmentType?.trim()) {
      throw new ApiError("Employment type is required before managed hiring activation.", 409);
    }
    if (!requirement.jobTitles.length) {
      throw new ApiError("At least one job title is required before activation.", 409);
    }
    if (!requirement.skillsRequired.length) {
      throw new ApiError("At least one required skill is required before activation.", 409);
    }

    const agreement = params.activeAgreementId
      ? await tx.commercialAgreement.findUnique({ where: { id: params.activeAgreementId } })
      : await tx.commercialAgreement.findFirst({
          where: {
            requirementId: requirement.id,
            companyId: requirement.companyId,
            status: "ACTIVE",
          },
          orderBy: { updatedAt: "desc" },
        });

    if (
      !agreement ||
      agreement.requirementId !== requirement.id ||
      agreement.companyId !== requirement.companyId ||
      agreement.status !== "ACTIVE"
    ) {
      throw new ApiError(
        "A signed ACTIVE commercial agreement linked to this requirement and company is required before activation.",
        409,
      );
    }

    const positions = parsePositions(requirement);
    if (!positions.length) {
      throw new ApiError("No valid managed hiring positions are available for activation.", 409);
    }

    const titleCounts = new Map<string, number>();
    const jobs = [];
    for (const position of positions) {
      const normalizedTitle = position.jobTitle.toLowerCase();
      const occurrence = (titleCounts.get(normalizedTitle) ?? 0) + 1;
      titleCounts.set(normalizedTitle, occurrence);
      const managedRoleKey = roleKey(position.jobTitle, occurrence);

      const existing = await tx.jobListing.findUnique({
        where: {
          managedRequirementId_managedRoleKey: {
            managedRequirementId: requirement.id,
            managedRoleKey,
          },
        },
        select: { id: true },
      });

      const skillRequirements = [
        ...requirement.skillsRequired.map((name) => ({ name, priority: "required" })),
        ...requirement.preferredSkills.map((name) => ({ name, priority: "preferred" })),
      ] as Prisma.InputJsonValue;

      const data = {
        companyId: requirement.companyId,
        title: position.jobTitle,
        department: requirement.department,
        location: position.location,
        type: requirement.employmentType,
        salaryRange: `${requirement.currency} ${requirement.salaryRangeMin}-${requirement.salaryRangeMax}`,
        description: descriptionFor(requirement, position),
        requirements: [
          ...requirement.skillsRequired,
          `Experience: ${position.experienceYears}`,
          `Education: ${requirement.education}`,
        ],
        skillRequirements,
        managedRequirementId: requirement.id,
        managedAgreementId: agreement.id,
        managedRoleKey,
        status: "ACTIVE" as const,
      };

      const job = existing
        ? await tx.jobListing.update({ where: { id: existing.id }, data })
        : await tx.jobListing.create({ data });
      jobs.push(job);

      if (!existing) {
        await OutboxPublisher.publish(
          {
            eventType: "JOB_LISTING_CREATED",
            payload: {
              jobId: job.id,
              managedRequirementId: requirement.id,
              managedAgreementId: agreement.id,
            },
            correlationId: `managed-requirement:${requirement.id}`,
            companyId: requirement.companyId,
            idempotencyKey: `managed-requirement:${requirement.id}:job:${managedRoleKey}`,
          },
          tx,
        );
      }
    }

    const updatedRequirement = await tx.hiringRequirement.update({
      where: { id: requirement.id },
      data: {
        status: "ACTIVE",
        ...(params.assignedSalesLead?.trim()
          ? { assignedSalesLead: params.assignedSalesLead.trim() }
          : {}),
      },
    });

    return {
      requirement: updatedRequirement,
      agreementId: agreement.id,
      jobs,
    };
  });
}
