import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedisValue } from "@/lib/redis";

export const dynamic = "force-dynamic";

type HealthSnapshot = {
  databaseOk: boolean;
  redisOk: boolean;
};

let lastCheckTime = 0;
let cachedHealth: HealthSnapshot = { databaseOk: true, redisOk: true };
let inFlightCheck: Promise<HealthSnapshot> | null = null;
const CACHE_TTL_MS = 10_000;

async function runHealthChecks(): Promise<HealthSnapshot> {
  const [databaseOk, redisOk] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    getRedisValue("health:redis:probe").then(() => true).catch(() => false),
  ]);
  return { databaseOk, redisOk };
}

export async function GET() {
  const now = Date.now();

  if (now - lastCheckTime > CACHE_TTL_MS) {
    if (!inFlightCheck) {
      inFlightCheck = runHealthChecks()
        .then((snapshot) => {
          cachedHealth = snapshot;
          lastCheckTime = Date.now();
          inFlightCheck = null;
          return snapshot;
        })
        .catch(() => {
          cachedHealth = { databaseOk: false, redisOk: false };
          lastCheckTime = Date.now();
          inFlightCheck = null;
          return cachedHealth;
        });
    }
    await inFlightCheck;
  }

  const healthy = cachedHealth.databaseOk && cachedHealth.redisOk;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      checks: {
        database: cachedHealth.databaseOk ? "ok" : "down",
        redis: cachedHealth.redisOk ? "ok" : "down",
        redisBackend: cachedHealth.redisOk ? "DISTRIBUTED REDIS" : "UNAVAILABLE",
        environment: "ok",
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
