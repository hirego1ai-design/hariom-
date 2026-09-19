import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

let lastCheckTime = 0;
let cachedDbOk = false;
const CACHE_TTL_MS = 5_000;

export async function GET() {
  const now = Date.now();
  if (now - lastCheckTime > CACHE_TTL_MS) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      cachedDbOk = true;
    } catch {
      cachedDbOk = false;
    }
    lastCheckTime = now;
  }

  return NextResponse.json(
    {
      status: cachedDbOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: cachedDbOk ? "connected" : "disconnected",
    },
    { status: cachedDbOk ? 200 : 503 }
  );
}
