import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

let lastCheckTime = 0;
let cachedDbOk = true;
let inFlightCheck: Promise<boolean> | null = null;
const CACHE_TTL_MS = 10_000;

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const now = Date.now();
  if (now - lastCheckTime > CACHE_TTL_MS) {
    if (!inFlightCheck) {
      inFlightCheck = checkDatabase()
        .then((ok) => {
          cachedDbOk = ok;
          lastCheckTime = Date.now();
          inFlightCheck = null;
          return ok;
        })
        .catch(() => {
          cachedDbOk = false;
          lastCheckTime = Date.now();
          inFlightCheck = null;
          return false;
        });
    }
    await inFlightCheck;
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
