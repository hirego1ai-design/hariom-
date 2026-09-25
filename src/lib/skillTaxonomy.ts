import { prisma } from "@/lib/prisma";
import { getCanonicalSkillName } from "@/lib/skill-master";

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function resolveCanonicalSkillTags(rawTags: string[]) {
  const requested = Array.from(new Set(rawTags.map(normalizeTag).filter(Boolean)));
  const resolved = new Map<string, string>();
  const unresolved: string[] = [];

  for (const tag of requested) {
    const canonical = getCanonicalSkillName(tag);
    if (canonical) resolved.set(tag.toLowerCase(), canonical);
    else unresolved.push(tag);
  }

  if (unresolved.length) {
    const databaseSkills = await prisma.skillMaster.findMany({
      where: {
        isActive: true,
        OR: unresolved.map((name) => ({
          name: { equals: name, mode: "insensitive" as const },
        })),
      },
      select: { name: true },
    });
    const dbByNormalized = new Map(
      databaseSkills.map((skill) => [normalizeTag(skill.name).toLowerCase(), skill.name]),
    );
    for (const tag of unresolved) {
      const canonical = dbByNormalized.get(tag.toLowerCase());
      if (canonical) resolved.set(tag.toLowerCase(), canonical);
    }
  }

  const canonicalTags = requested
    .map((tag) => resolved.get(tag.toLowerCase()))
    .filter((tag): tag is string => !!tag);

  const unknownTags = requested.filter((tag) => !resolved.has(tag.toLowerCase()));
  return {
    canonicalTags: Array.from(new Set(canonicalTags)),
    unknownTags,
  };
}
