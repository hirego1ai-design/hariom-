import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("admin infected-upload purge is authorized before destructive storage work", () => {
  const route = fs.readFileSync(
    new URL("../app/api/admin/uploads/purge-infected/route.ts", import.meta.url),
    "utf8",
  );

  assert(route.includes("requireAdminSession(request)"));
  assert(route.includes("logCriticalAuditEvent"));
  assert(route.includes("UPLOAD_INFECTED_RETENTION_PURGE_REQUESTED"));
  assert(route.includes("purgeExpiredInfectedUploads"));
  assert(
    route.indexOf("UPLOAD_INFECTED_RETENTION_PURGE_REQUESTED") <
      route.indexOf("purgeExpiredInfectedUploads(input.limit, input.retentionDays)"),
  );
  assert(route.includes("UPLOAD_INFECTED_RETENTION_PURGE"));
});

test("admin quarantine rescan is authorized before scanner side effects", () => {
  const route = fs.readFileSync(
    new URL("../app/api/admin/uploads/rescan/route.ts", import.meta.url),
    "utf8",
  );

  assert(route.includes("requireAdminSession(request)"));
  assert(route.includes("logCriticalAuditEvent"));
  assert(route.includes("UPLOAD_SECURITY_RESCAN_REQUESTED"));
  assert(route.includes("rescanQuarantinedUploads"));
  assert(
    route.indexOf("UPLOAD_SECURITY_RESCAN_REQUESTED") <
      route.indexOf("rescanQuarantinedUploads(limit)"),
  );
  assert(route.includes("UPLOAD_SECURITY_RESCAN"));
});
