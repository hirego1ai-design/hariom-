import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleSkillSuggestions, searchRoles, searchSkills } from "@/lib/skill-master";
import { z } from "zod";

const createSkillRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(120).optional().default(""),
}).strict();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = searchParams.get("q") || "";

  if (type === "roles") {
    return NextResponse.json({ roles: searchRoles(query) });
  }
  if (type === "skills") {
    return NextResponse.json({ skills: searchSkills(query) });
  }
  if (type === "suggestions") {
    return NextResponse.json({
      skills: getRoleSkillSuggestions(searchParams.get("role") || ""),
    });
  }

  return NextResponse.json(
    { error: "Unsupported skill master request." },
    { status: 400 },
  );
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to suggest a new skill." },
      { status: 401 },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = createSkillRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid skill name and optional role." },
      { status: 400 },
    );
  }

  const name = parsed.data.name.replace(/\s+/g, " ");
  const role = parsed.data.role.replace(/\s+/g, " ");

  const requestRecord = await prisma.customSkillRequest.create({
    data: {
      name,
      normalizedName: name.toLowerCase(),
      suggestedForRole: role || null,
      requestedById: session.id,
    },
  });

  return NextResponse.json(
    { request: requestRecord, status: "PENDING" },
    { status: 201 },
  );
}
