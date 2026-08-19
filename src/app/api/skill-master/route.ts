import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleSkillSuggestions, searchRoles, searchSkills } from "@/lib/skill-master";

const developmentRequests: Array<{ name: string; role: string; requestedById: string; createdAt: string }> = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = searchParams.get("q") || "";

  if (type === "roles") return NextResponse.json({ roles: searchRoles(query) });
  if (type === "skills") return NextResponse.json({ skills: searchSkills(query) });
  if (type === "suggestions") return NextResponse.json({ skills: getRoleSkillSuggestions(searchParams.get("role") || "") });

  return NextResponse.json({ error: "Unsupported skill master request." }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const session = getCurrentSession(request.headers);
  if (!session) return NextResponse.json({ error: "Sign in to suggest a new skill." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const role = typeof body?.role === "string" ? body.role.trim().slice(0, 120) : "";
  if (!name || name.length > 80) return NextResponse.json({ error: "Enter a skill name between 1 and 80 characters." }, { status: 400 });

  try {
    const requestRecord = await prisma.customSkillRequest.create({
      data: { name, normalizedName: name.toLowerCase(), suggestedForRole: role || null, requestedById: session.id },
    });
    return NextResponse.json({ request: requestRecord, status: "PENDING" }, { status: 201 });
  } catch {
    // Lets development testing continue without a configured database. Production
    // persists the same request in CustomSkillRequest for admin approval.
    developmentRequests.push({ name, role, requestedById: session.id, createdAt: new Date().toISOString() });
    return NextResponse.json({ status: "PENDING", developmentFallback: true }, { status: 202 });
  }
}
