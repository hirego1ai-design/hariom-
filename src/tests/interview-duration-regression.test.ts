import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("interview duration is customizable from 10 to 60 minutes and server-authoritative", () => {
  const builder = fs.readFileSync(
    new URL("../app/employer/interview-round-builder/page.tsx", import.meta.url),
    "utf8",
  );
  const processRoute = fs.readFileSync(
    new URL("../app/api/employer/jobs/[id]/interview-process/route.ts", import.meta.url),
    "utf8",
  );
  const scheduleRoute = fs.readFileSync(
    new URL("../app/api/employer/interviews/schedule/route.ts", import.meta.url),
    "utf8",
  );

  assert(builder.includes('type="number"'));
  assert(builder.includes("min={10}"));
  assert(builder.includes("max={60}"));
  assert(builder.includes("Custom duration from 10 to 60 minutes."));
  assert(builder.includes("Interview duration must be between 10 and 60 minutes."));

  assert(processRoute.includes("durationMins: z.number().int().min(10).max(60)"));
  assert(!processRoute.includes("durationMins: z.number().int().min(15).max(240)"));

  assert(scheduleRoute.includes("}).strict();"));
  assert(!scheduleRoute.includes("durationMins: z.number()"));
  assert(scheduleRoute.includes("const durationMins = round.durationMins;"));
  assert(scheduleRoute.includes("durationMins: durationMins"));
});
