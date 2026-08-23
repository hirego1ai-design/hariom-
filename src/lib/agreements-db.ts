// ============================================================================
// HIREGO MANAGED HIRING™ — COMMERCIAL AGREEMENT DATABASE REPOSITORY
// Single Source of Truth for Hiring Requirements, Templates & Contracts
// ============================================================================

import {
  HiringRequirementRecord,
  AgreementTemplateRecord,
  CommercialAgreementRecord,
  AgreementEventRecord,
  RequirementStatus,
  AgreementStatus,
} from "@/types";
import { prisma } from "./prisma";

export type {
  HiringRequirementRecord,
  AgreementTemplateRecord,
  CommercialAgreementRecord,
  AgreementEventRecord,
  RequirementStatus,
  AgreementStatus,
};

// ----------------------------------------------------------------------------
// INITIAL SEED DATA
// ----------------------------------------------------------------------------

export const initialTemplates: AgreementTemplateRecord[] = [
  {
    id: "tpl-default-1",
    name: "Standard Enterprise Commercial SLA",
    slug: "standard-enterprise-sla",
    description: "Standard SLA agreement with 90 days replacement warranty",
    category: "Enterprise",
    feeType: "PERCENTAGE",
    feeValue: 8.33,
    invoiceRule: "ON_JOINING",
    replacementDays: 90,
    specialClauses: ["Confidentiality & Non-Disclosure", "Replacement Guarantee SLA"],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
export const initialRequirements: HiringRequirementRecord[] = [
  {
    id: "req-default-1",
    referenceCode: "REQ-2026-001",
    companyName: "HireGo Enterprise Partner",
    contactPerson: "Sarah Jenkins",
    email: "sarah.j@enterprise.com",
    primaryMobile: "+91 9876543210",
    industry: "Technology",
    numberOfPositions: 3,
    jobTitles: ["Senior Full Stack Engineer"],
    experienceYears: "4+ Years",
    skillsRequired: ["React", "TypeScript", "Node.js"],
    education: "B.Tech / MCA",
    salaryRangeMin: 1800000,
    salaryRangeMax: 2800000,
    currency: "INR",
    workMode: "Remote",
    location: "Bangalore / Remote",
    joiningTimeline: "Immediate",
    hiringPriority: "High",
    replacementExpectation: "90 Days",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
export const initialAgreements: CommercialAgreementRecord[] = [];
export const initialEvents: AgreementEventRecord[] = [];



// ----------------------------------------------------------------------------
// SINGLETON IN-MEMORY DATABASE STORE WITH DUAL PRISMA LOGIC
// ----------------------------------------------------------------------------

class AgreementsStore {
  requirements: HiringRequirementRecord[] = [...initialRequirements];
  templates: AgreementTemplateRecord[] = [...initialTemplates];
  agreements: CommercialAgreementRecord[] = [...initialAgreements];
  events: AgreementEventRecord[] = [...initialEvents];

  // Requirements
  async getRequirements(): Promise<HiringRequirementRecord[]> {
    try {
      const records = await prisma.hiringRequirement.findMany({
        orderBy: { createdAt: "desc" },
        include: { agreements: true }
      });
      if (records && records.length > 0) {
        return records.map((r) => {
          const activeAgreement = r.agreements.find(a => a.status === "ACTIVE" || a.status === "SENT_TO_EMPLOYER" || a.status === "AMENDMENT_REQUESTED");
          return {
            id: r.id,
            referenceCode: r.referenceCode,
            companyId: r.companyId || undefined,
            companyName: r.companyName,
            contactPerson: r.contactPerson,
            email: r.email,
            primaryMobile: r.primaryMobile,
            secondaryMobile: r.secondaryMobile || undefined,
            industry: r.industry,
            numberOfPositions: r.numberOfPositions,
            jobTitles: r.jobTitles,
            experienceYears: r.experienceYears,
            skillsRequired: r.skillsRequired,
            education: r.education,
            certifications: r.certifications || undefined,
            salaryRangeMin: r.salaryRangeMin,
            salaryRangeMax: r.salaryRangeMax,
            currency: r.currency,
            workMode: r.workMode,
            location: r.location,
            joiningTimeline: r.joiningTimeline,
            hiringPriority: r.hiringPriority,
            replacementExpectation: r.replacementExpectation,
            additionalNotes: r.additionalNotes || undefined,
            jdFileUrl: r.jdFileUrl || undefined,
            status: r.status as RequirementStatus,
            assignedSalesLead: r.assignedSalesLead || undefined,
            activeAgreementId: activeAgreement?.id || undefined,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        });
      }
    } catch {
      // Fallback
    }
    return this.requirements;
  }

  async getRequirementById(id: string): Promise<HiringRequirementRecord | null> {
    try {
      const r = await prisma.hiringRequirement.findFirst({
        where: { OR: [{ id }, { referenceCode: id }] },
        include: { agreements: true }
      });
      if (r) {
        const activeAgreement = r.agreements.find(a => a.status === "ACTIVE" || a.status === "SENT_TO_EMPLOYER" || a.status === "AMENDMENT_REQUESTED");
        return {
          id: r.id,
          referenceCode: r.referenceCode,
          companyId: r.companyId || undefined,
          companyName: r.companyName,
          contactPerson: r.contactPerson,
          email: r.email,
          primaryMobile: r.primaryMobile,
          secondaryMobile: r.secondaryMobile || undefined,
          industry: r.industry,
          numberOfPositions: r.numberOfPositions,
          jobTitles: r.jobTitles,
          experienceYears: r.experienceYears,
          skillsRequired: r.skillsRequired,
          education: r.education,
          certifications: r.certifications || undefined,
          salaryRangeMin: r.salaryRangeMin,
          salaryRangeMax: r.salaryRangeMax,
          currency: r.currency,
          workMode: r.workMode,
          location: r.location,
          joiningTimeline: r.joiningTimeline,
          hiringPriority: r.hiringPriority,
          replacementExpectation: r.replacementExpectation,
          additionalNotes: r.additionalNotes || undefined,
          jdFileUrl: r.jdFileUrl || undefined,
          status: r.status as RequirementStatus,
          assignedSalesLead: r.assignedSalesLead || undefined,
          activeAgreementId: activeAgreement?.id || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }
    return this.requirements.find((r) => r.id === id || r.referenceCode === id) || null;
  }

  async createRequirement(payload: Omit<HiringRequirementRecord, "id" | "referenceCode" | "status" | "createdAt" | "updatedAt">): Promise<HiringRequirementRecord> {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const id = `req-${Date.now()}`;
    const referenceCode = `REQ-2026-${randomNum}`;
    const newReq: HiringRequirementRecord = {
      ...payload,
      id,
      referenceCode,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const r = await prisma.hiringRequirement.create({
        data: {
          id,
          referenceCode,
          companyId: payload.companyId || null,
          companyName: payload.companyName,
          contactPerson: payload.contactPerson,
          email: payload.email,
          primaryMobile: payload.primaryMobile,
          secondaryMobile: payload.secondaryMobile || null,
          industry: payload.industry,
          numberOfPositions: payload.numberOfPositions,
          jobTitles: payload.jobTitles,
          experienceYears: payload.experienceYears,
          skillsRequired: payload.skillsRequired,
          education: payload.education,
          certifications: payload.certifications || null,
          salaryRangeMin: payload.salaryRangeMin,
          salaryRangeMax: payload.salaryRangeMax,
          currency: payload.currency || "INR",
          workMode: payload.workMode || "Hybrid",
          location: payload.location,
          joiningTimeline: payload.joiningTimeline,
          hiringPriority: payload.hiringPriority || "Standard",
          replacementExpectation: payload.replacementExpectation || "90 Days",
          additionalNotes: payload.additionalNotes || null,
          jdFileUrl: payload.jdFileUrl || null,
          status: "SUBMITTED"
        }
      });
      newReq.createdAt = r.createdAt.toISOString();
      newReq.updatedAt = r.updatedAt.toISOString();
    } catch {
      // Fallback
    }

    this.requirements.unshift(newReq);
    return newReq;
  }

  async updateRequirementStatus(id: string, status: RequirementStatus, assignedSalesLead?: string, activeAgreementId?: string): Promise<HiringRequirementRecord | null> {
    try {
      const req = await prisma.hiringRequirement.findFirst({
        where: { OR: [{ id }, { referenceCode: id }] }
      });
      if (req) {
        const updateData: any = { status };
        if (assignedSalesLead) updateData.assignedSalesLead = assignedSalesLead;
        // activeAgreementId relation is managed via CommercialAgreement.requirementId database side, so no direct column update needed.
        const r = await prisma.hiringRequirement.update({
          where: { id: req.id },
          data: updateData
        });
        
        // Sync local memory fallback as well
        const memReq = this.requirements.find((mr) => mr.id === req.id || mr.referenceCode === req.referenceCode);
        if (memReq) {
          memReq.status = status;
          if (assignedSalesLead) memReq.assignedSalesLead = assignedSalesLead;
          if (activeAgreementId) memReq.activeAgreementId = activeAgreementId;
          memReq.updatedAt = r.updatedAt.toISOString();
        }

        return {
          id: r.id,
          referenceCode: r.referenceCode,
          companyId: r.companyId || undefined,
          companyName: r.companyName,
          contactPerson: r.contactPerson,
          email: r.email,
          primaryMobile: r.primaryMobile,
          secondaryMobile: r.secondaryMobile || undefined,
          industry: r.industry,
          numberOfPositions: r.numberOfPositions,
          jobTitles: r.jobTitles,
          experienceYears: r.experienceYears,
          skillsRequired: r.skillsRequired,
          education: r.education,
          certifications: r.certifications || undefined,
          salaryRangeMin: r.salaryRangeMin,
          salaryRangeMax: r.salaryRangeMax,
          currency: r.currency,
          workMode: r.workMode,
          location: r.location,
          joiningTimeline: r.joiningTimeline,
          hiringPriority: r.hiringPriority,
          replacementExpectation: r.replacementExpectation,
          additionalNotes: r.additionalNotes || undefined,
          jdFileUrl: r.jdFileUrl || undefined,
          status: r.status as RequirementStatus,
          assignedSalesLead: r.assignedSalesLead || undefined,
          activeAgreementId: activeAgreementId,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const req = this.requirements.find((r) => r.id === id || r.referenceCode === id);
    if (req) {
      req.status = status;
      if (assignedSalesLead) req.assignedSalesLead = assignedSalesLead;
      if (activeAgreementId) req.activeAgreementId = activeAgreementId;
      req.updatedAt = new Date().toISOString();
    }
    return req || null;
  }

  // Templates
  async getTemplates(includeArchived = false): Promise<AgreementTemplateRecord[]> {
    try {
      const records = await prisma.agreementTemplate.findMany({
        where: includeArchived ? {} : { isArchived: false },
        orderBy: { createdAt: "desc" }
      });
      if (records && records.length > 0) {
        return records.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          category: r.category,
          feeType: r.feeType as any,
          feeValue: r.feeValue,
          invoiceRule: r.invoiceRule as any,
          replacementDays: r.replacementDays,
          validityMonths: r.validityMonths,
          advancePayment: r.advancePayment,
          creditTermsDays: r.creditTermsDays,
          standardDiscountPct: r.standardDiscountPct,
          taxRatePct: r.taxRatePct,
          specialClauses: r.specialClauses,
          commercialNotes: r.commercialNotes || undefined,
          isArchived: r.isArchived,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Fallback
    }
    if (includeArchived) return this.templates;
    return this.templates.filter((t) => !t.isArchived);
  }

  async getTemplateById(idOrSlug: string): Promise<AgreementTemplateRecord | null> {
    try {
      const r = await prisma.agreementTemplate.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
      });
      if (r) {
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          category: r.category,
          feeType: r.feeType as any,
          feeValue: r.feeValue,
          invoiceRule: r.invoiceRule as any,
          replacementDays: r.replacementDays,
          validityMonths: r.validityMonths,
          advancePayment: r.advancePayment,
          creditTermsDays: r.creditTermsDays,
          standardDiscountPct: r.standardDiscountPct,
          taxRatePct: r.taxRatePct,
          specialClauses: r.specialClauses,
          commercialNotes: r.commercialNotes || undefined,
          isArchived: r.isArchived,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }
    return this.templates.find((t) => t.id === idOrSlug || t.slug === idOrSlug) || null;
  }

  async createTemplate(payload: Omit<AgreementTemplateRecord, "id" | "slug" | "createdAt" | "updatedAt">): Promise<AgreementTemplateRecord> {
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const id = `tpl-${Date.now()}`;
    const generatedSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    const newTpl: AgreementTemplateRecord = {
      ...payload,
      id,
      slug: generatedSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const r = await prisma.agreementTemplate.create({
        data: {
          id,
          name: payload.name,
          slug: generatedSlug,
          description: payload.description,
          category: payload.category || "General",
          feeType: payload.feeType,
          feeValue: payload.feeValue,
          invoiceRule: payload.invoiceRule,
          replacementDays: payload.replacementDays,
          validityMonths: payload.validityMonths,
          advancePayment: payload.advancePayment,
          creditTermsDays: payload.creditTermsDays,
          standardDiscountPct: payload.standardDiscountPct,
          taxRatePct: payload.taxRatePct,
          specialClauses: payload.specialClauses,
          commercialNotes: payload.commercialNotes || null,
          isArchived: false
        }
      });
      newTpl.createdAt = r.createdAt.toISOString();
      newTpl.updatedAt = r.updatedAt.toISOString();
    } catch {
      // Fallback
    }

    this.templates.unshift(newTpl);
    return newTpl;
  }

  async updateTemplate(id: string, updates: Partial<AgreementTemplateRecord>): Promise<AgreementTemplateRecord | null> {
    try {
      const tpl = await prisma.agreementTemplate.findUnique({ where: { id } });
      if (tpl) {
        const updateData: any = { ...updates };
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const r = await prisma.agreementTemplate.update({
          where: { id },
          data: updateData
        });

        const memTpl = this.templates.find(t => t.id === id);
        if (memTpl) {
          Object.assign(memTpl, updates, { updatedAt: r.updatedAt.toISOString() });
        }

        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          category: r.category,
          feeType: r.feeType as any,
          feeValue: r.feeValue,
          invoiceRule: r.invoiceRule as any,
          replacementDays: r.replacementDays,
          validityMonths: r.validityMonths,
          advancePayment: r.advancePayment,
          creditTermsDays: r.creditTermsDays,
          standardDiscountPct: r.standardDiscountPct,
          taxRatePct: r.taxRatePct,
          specialClauses: r.specialClauses,
          commercialNotes: r.commercialNotes || undefined,
          isArchived: r.isArchived,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const tpl = this.templates.find((t) => t.id === id);
    if (tpl) {
      Object.assign(tpl, updates, { updatedAt: new Date().toISOString() });
    }
    return tpl || null;
  }

  async duplicateTemplate(id: string): Promise<AgreementTemplateRecord | null> {
    const orig = await this.getTemplateById(id);
    if (!orig) return null;
    const duplicatedPayload: Omit<AgreementTemplateRecord, "id" | "slug" | "createdAt" | "updatedAt"> = {
      name: `${orig.name} (Copy)`,
      description: orig.description,
      category: orig.category,
      feeType: orig.feeType,
      feeValue: orig.feeValue,
      invoiceRule: orig.invoiceRule,
      replacementDays: orig.replacementDays,
      validityMonths: orig.validityMonths,
      advancePayment: orig.advancePayment,
      creditTermsDays: orig.creditTermsDays,
      standardDiscountPct: orig.standardDiscountPct,
      taxRatePct: orig.taxRatePct,
      specialClauses: orig.specialClauses,
      commercialNotes: orig.commercialNotes,
      isArchived: orig.isArchived,
    };
    return this.createTemplate(duplicatedPayload);
  }

  async archiveTemplate(id: string): Promise<AgreementTemplateRecord | null> {
    return this.updateTemplate(id, { isArchived: true });
  }

  // Agreements
  async getAgreements(): Promise<CommercialAgreementRecord[]> {
    try {
      const records = await prisma.commercialAgreement.findMany({
        orderBy: { createdAt: "desc" }
      });
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          agreementNumber: r.agreementNumber,
          companyId: r.companyId || undefined,
          requirementId: r.requirementId || undefined,
          templateId: r.templateId || undefined,
          companyName: r.companyName,
          clientLegalName: r.clientLegalName,
          contactPerson: r.contactPerson,
          clientEmail: r.clientEmail,
          clientPhone: r.clientPhone,
          status: r.status as AgreementStatus,
          feeType: r.feeType as any,
          feeValue: r.feeValue,
          invoiceRule: r.invoiceRule as any,
          replacementDays: r.replacementDays,
          validityStartDate: r.validityStartDate.toISOString(),
          validityEndDate: r.validityEndDate.toISOString(),
          advancePaymentAmount: r.advancePaymentAmount,
          discountPercentage: r.discountPercentage,
          creditDays: r.creditDays,
          taxRatePct: r.taxRatePct,
          customClauses: r.customClauses,
          commercialNotes: r.commercialNotes || undefined,
          salesExecutiveNotes: r.salesExecutiveNotes || undefined,
          signedByName: r.signedByName || undefined,
          signedByDesignation: r.signedByDesignation || undefined,
          signedAt: r.signedAt ? r.signedAt.toISOString() : undefined,
          signerIpAddress: r.signerIpAddress || undefined,
          amendmentNotes: r.amendmentNotes || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Fallback
    }
    return this.agreements;
  }

  async getAgreementById(id: string): Promise<CommercialAgreementRecord | null> {
    try {
      const r = await prisma.commercialAgreement.findFirst({
        where: { OR: [{ id }, { agreementNumber: id }] }
      });
      if (r) {
        return {
          id: r.id,
          agreementNumber: r.agreementNumber,
          companyId: r.companyId || undefined,
          requirementId: r.requirementId || undefined,
          templateId: r.templateId || undefined,
          companyName: r.companyName,
          clientLegalName: r.clientLegalName,
          contactPerson: r.contactPerson,
          clientEmail: r.clientEmail,
          clientPhone: r.clientPhone,
          status: r.status as AgreementStatus,
          feeType: r.feeType as any,
          feeValue: r.feeValue,
          invoiceRule: r.invoiceRule as any,
          replacementDays: r.replacementDays,
          validityStartDate: r.validityStartDate.toISOString(),
          validityEndDate: r.validityEndDate.toISOString(),
          advancePaymentAmount: r.advancePaymentAmount,
          discountPercentage: r.discountPercentage,
          creditDays: r.creditDays,
          taxRatePct: r.taxRatePct,
          customClauses: r.customClauses,
          commercialNotes: r.commercialNotes || undefined,
          salesExecutiveNotes: r.salesExecutiveNotes || undefined,
          signedByName: r.signedByName || undefined,
          signedByDesignation: r.signedByDesignation || undefined,
          signedAt: r.signedAt ? r.signedAt.toISOString() : undefined,
          signerIpAddress: r.signerIpAddress || undefined,
          amendmentNotes: r.amendmentNotes || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }
    return this.agreements.find((a) => a.id === id || a.agreementNumber === id) || null;
  }

  async createAgreement(payload: Omit<CommercialAgreementRecord, "id" | "agreementNumber" | "status" | "createdAt" | "updatedAt">): Promise<CommercialAgreementRecord> {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `agr-${Date.now()}`;
    const agreementNumber = `HGO-CMA-2026-${rand}`;
    const newAgr: CommercialAgreementRecord = {
      ...payload,
      id,
      agreementNumber,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const r = await prisma.commercialAgreement.create({
        data: {
          id,
          agreementNumber,
          companyId: payload.companyId || null,
          requirementId: payload.requirementId || null,
          templateId: payload.templateId || null,
          companyName: payload.companyName,
          clientLegalName: payload.clientLegalName || payload.companyName,
          contactPerson: payload.contactPerson,
          clientEmail: payload.clientEmail || "",
          clientPhone: payload.clientPhone || "",
          status: "DRAFT",
          feeType: payload.feeType,
          feeValue: payload.feeValue,
          invoiceRule: payload.invoiceRule,
          replacementDays: payload.replacementDays,
          validityStartDate: payload.validityStartDate ? new Date(payload.validityStartDate) : new Date(),
          validityEndDate: payload.validityEndDate ? new Date(payload.validityEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          advancePaymentAmount: payload.advancePaymentAmount || 0,
          discountPercentage: payload.discountPercentage || 0,
          creditDays: payload.creditDays || 15,
          taxRatePct: payload.taxRatePct || 18.0,
          customClauses: payload.customClauses || [],
          commercialNotes: payload.commercialNotes || null,
          salesExecutiveNotes: payload.salesExecutiveNotes || null,
        }
      });
      newAgr.createdAt = r.createdAt.toISOString();
      newAgr.updatedAt = r.updatedAt.toISOString();
    } catch {
      // Fallback
    }

    this.agreements.unshift(newAgr);

    // Event log
    await this.addEvent(newAgr.id, "CREATED", "Sales/Admin", "Agreement initialized from template.");

    // Update parent requirement if linked
    if (payload.requirementId) {
      await this.updateRequirementStatus(payload.requirementId, "AGREEMENT_DRAFTED", undefined, newAgr.id);
    }

    return newAgr;
  }

  async updateAgreement(id: string, updates: Partial<CommercialAgreementRecord>, performedBy = "Sales/Admin", note?: string): Promise<CommercialAgreementRecord | null> {
    try {
      const agr = await prisma.commercialAgreement.findFirst({
        where: { OR: [{ id }, { agreementNumber: id }] }
      });
      if (agr) {
        const updateData: any = { ...updates };
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        if (updates.validityStartDate) updateData.validityStartDate = new Date(updates.validityStartDate);
        if (updates.validityEndDate) updateData.validityEndDate = new Date(updates.validityEndDate);

        const r = await prisma.commercialAgreement.update({
          where: { id: agr.id },
          data: updateData
        });

        // Sync local memory fallback
        const idx = this.agreements.findIndex(a => a.id === agr.id || a.agreementNumber === agr.agreementNumber);
        if (idx !== -1) {
          Object.assign(this.agreements[idx], updates, { updatedAt: r.updatedAt.toISOString() });
        }

        if (updates.status && updates.status !== agr.status) {
          let eventType: AgreementEventRecord["eventType"] = "DRAFT_UPDATED";
          if (updates.status === "SENT_TO_EMPLOYER") eventType = "SENT";
          else if (updates.status === "ACTIVE") eventType = "ACCEPTED";
          else if (updates.status === "AMENDMENT_REQUESTED") eventType = "AMENDMENT_REQUESTED";
          else if (updates.status === "REJECTED") eventType = "REJECTED";

          await this.addEvent(r.id, eventType, performedBy, note || `Agreement status updated to ${updates.status}`);

          if (r.requirementId) {
            if (updates.status === "SENT_TO_EMPLOYER") {
              await this.updateRequirementStatus(r.requirementId, "AGREEMENT_SENT");
            } else if (updates.status === "ACTIVE") {
              await this.updateRequirementStatus(r.requirementId, "ACTIVE");
            }
          }
        } else {
          await this.addEvent(r.id, "DRAFT_UPDATED", performedBy, note || "Agreement terms modified.");
        }

        return this.getAgreementById(r.id);
      }
    } catch {
      // Fallback
    }

    const agr = this.agreements.find((a) => a.id === id || a.agreementNumber === id);
    if (!agr) return null;

    Object.assign(agr, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== agr.status) {
      let eventType: AgreementEventRecord["eventType"] = "DRAFT_UPDATED";
      if (updates.status === "SENT_TO_EMPLOYER") eventType = "SENT";
      else if (updates.status === "ACTIVE") eventType = "ACCEPTED";
      else if (updates.status === "AMENDMENT_REQUESTED") eventType = "AMENDMENT_REQUESTED";
      else if (updates.status === "REJECTED") eventType = "REJECTED";

      await this.addEvent(agr.id, eventType, performedBy, note || `Agreement status updated to ${updates.status}`);

      if (agr.requirementId) {
        if (updates.status === "SENT_TO_EMPLOYER") {
          await this.updateRequirementStatus(agr.requirementId, "AGREEMENT_SENT");
        } else if (updates.status === "ACTIVE") {
          await this.updateRequirementStatus(agr.requirementId, "ACTIVE");
        }
      }
    } else {
      await this.addEvent(agr.id, "DRAFT_UPDATED", performedBy, note || "Agreement terms modified.");
    }

    return agr;
  }

  async acceptAgreement(id: string, signerName: string, designation: string, ipAddress: string): Promise<CommercialAgreementRecord | null> {
    try {
      const agr = await prisma.commercialAgreement.findFirst({
        where: { OR: [{ id }, { agreementNumber: id }] }
      });
      if (agr) {
        const r = await prisma.commercialAgreement.update({
          where: { id: agr.id },
          data: {
            status: "ACTIVE",
            signedByName: signerName,
            signedByDesignation: designation,
            signedAt: new Date(),
            signerIpAddress: ipAddress
          }
        });

        // Sync local memory fallback
        const idx = this.agreements.findIndex(a => a.id === agr.id || a.agreementNumber === agr.agreementNumber);
        if (idx !== -1) {
          this.agreements[idx].status = "ACTIVE";
          this.agreements[idx].signedByName = signerName;
          this.agreements[idx].signedByDesignation = designation;
          this.agreements[idx].signedAt = r.signedAt?.toISOString();
          this.agreements[idx].signerIpAddress = ipAddress;
          this.agreements[idx].updatedAt = r.updatedAt.toISOString();
        }

        await this.addEvent(
          r.id,
          "ACCEPTED",
          `${signerName} (${designation})`,
          `Digitally signed and accepted agreement. IP: ${ipAddress}`
        );

        if (r.requirementId) {
          await this.updateRequirementStatus(r.requirementId, "ACTIVE");
        }

        return this.getAgreementById(r.id);
      }
    } catch {
      // Fallback
    }

    const agr = this.agreements.find((a) => a.id === id || a.agreementNumber === id);
    if (!agr) return null;

    agr.status = "ACTIVE";
    agr.signedByName = signerName;
    agr.signedByDesignation = designation;
    agr.signedAt = new Date().toISOString();
    agr.signerIpAddress = ipAddress;
    agr.updatedAt = new Date().toISOString();

    await this.addEvent(
      agr.id,
      "ACCEPTED",
      `${signerName} (${designation})`,
      `Digitally signed and accepted agreement. IP: ${ipAddress}`
    );

    if (agr.requirementId) {
      await this.updateRequirementStatus(agr.requirementId, "ACTIVE");
    }

    return agr;
  }

  async requestAmendment(id: string, employerNotes: string, performedBy: string): Promise<CommercialAgreementRecord | null> {
    try {
      const agr = await prisma.commercialAgreement.findFirst({
        where: { OR: [{ id }, { agreementNumber: id }] }
      });
      if (agr) {
        const r = await prisma.commercialAgreement.update({
          where: { id: agr.id },
          data: {
            status: "AMENDMENT_REQUESTED",
            amendmentNotes: employerNotes
          }
        });

        // Sync local memory
        const idx = this.agreements.findIndex(a => a.id === agr.id || a.agreementNumber === agr.agreementNumber);
        if (idx !== -1) {
          this.agreements[idx].status = "AMENDMENT_REQUESTED";
          this.agreements[idx].amendmentNotes = employerNotes;
          this.agreements[idx].updatedAt = r.updatedAt.toISOString();
        }

        await this.addEvent(
          r.id,
          "AMENDMENT_REQUESTED",
          performedBy,
          `Employer requested changes: ${employerNotes}`
        );

        return this.getAgreementById(r.id);
      }
    } catch {
      // Fallback
    }

    const agr = this.agreements.find((a) => a.id === id || a.agreementNumber === id);
    if (!agr) return null;

    agr.status = "AMENDMENT_REQUESTED";
    agr.amendmentNotes = employerNotes;
    agr.updatedAt = new Date().toISOString();

    await this.addEvent(
      agr.id,
      "AMENDMENT_REQUESTED",
      performedBy,
      `Employer requested changes: ${employerNotes}`
    );

    return agr;
  }

  // Events
  async getEventsByAgreementId(agreementId: string): Promise<AgreementEventRecord[]> {
    try {
      const records = await prisma.agreementEvent.findMany({
        where: { agreementId },
        orderBy: { createdAt: "desc" }
      });
      if (records && records.length > 0) {
        return records.map(r => ({
          id: r.id,
          agreementId: r.agreementId,
          eventType: r.eventType as any,
          performedBy: r.performedBy,
          notes: r.notes || undefined,
          timestamp: r.createdAt.toISOString()
        }));
      }
    } catch {
      // Fallback
    }
    return this.events.filter((e) => e.agreementId === agreementId);
  }

  async addEvent(agreementId: string, eventType: AgreementEventRecord["eventType"], performedBy: string, notes?: string): Promise<AgreementEventRecord> {
    const id = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEvent: AgreementEventRecord = {
      id,
      agreementId,
      eventType,
      performedBy,
      notes,
      timestamp: new Date().toISOString(),
    };

    try {
      const r = await prisma.agreementEvent.create({
        data: {
          id,
          agreementId,
          eventType,
          performedBy,
          notes: notes || null
        }
      });
      newEvent.timestamp = r.createdAt.toISOString();
    } catch {
      // Fallback
    }

    this.events.unshift(newEvent);
    return newEvent;
  }
}

// Global persistent instance
const globalForAgreements = globalThis as unknown as { agreementsStore: AgreementsStore };
export const agreementsDb = globalForAgreements.agreementsStore || new AgreementsStore();
if (process.env.NODE_ENV !== "production") globalForAgreements.agreementsStore = agreementsDb;
