import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const catalogPath = path.join(process.cwd(), "config", "approved-email-templates.json");
const templates = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function assertCatalogue(items) {
  if (!Array.isArray(items) || items.length !== 84) throw new Error(`Expected 84 approved email templates, received ${items?.length ?? 0}.`);
  if (new Set(items.map((item) => item.providerAlias)).size !== 84) throw new Error("Approved email template aliases must be unique.");
  if (new Set(items.map((item) => item.eventKey)).size !== 49) throw new Error("Approved catalogue must cover 49 communication events.");
  for (const item of items) {
    if (item.channel !== "EMAIL" || item.provider !== "ZEPTOMAIL" || item.status !== "DRAFT" || item.enabled !== false || item.version !== 1) {
      throw new Error(`Unsafe initial state for ${item.providerAlias}.`);
    }
    if (!item.body.includes("hirego-logo-hd.png") || !item.body.includes("This is a transactional email")) {
      throw new Error(`Brand/footer validation failed for ${item.providerAlias}.`);
    }
  }
}

async function main() {
  assertCatalogue(templates);
  for (const item of templates) {
    const where = {
      eventKey_channel_audience_locale_version: {
        eventKey: item.eventKey,
        channel: item.channel,
        audience: item.audience,
        locale: item.locale,
        version: item.version,
      },
    };
    const data = {
      eventKey: item.eventKey,
      channel: item.channel,
      audience: item.audience,
      name: item.name,
      locale: item.locale,
      status: "DRAFT",
      provider: "ZEPTOMAIL",
      providerTemplateId: null,
      providerAlias: item.providerAlias,
      subject: item.subject,
      body: item.body,
      variableSchema: item.variableSchema,
      enabled: false,
      version: 1,
    };
    await prisma.communicationTemplate.upsert({
      where,
      create: data,
      update: {
        ...data,
        status: "DRAFT",
        enabled: false,
        providerTemplateId: null,
      },
    });
  }
  const [count, active] = await Promise.all([
    prisma.communicationTemplate.count({ where: { channel: "EMAIL", version: 1 } }),
    prisma.communicationTemplate.count({ where: { channel: "EMAIL", enabled: true } }),
  ]);
  if (count !== 84 || active !== 0) throw new Error(`Email template seed verification failed: count=${count}, active=${active}.`);
  console.log("Approved HireGo email templates seeded: 84 DRAFT + disabled.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
