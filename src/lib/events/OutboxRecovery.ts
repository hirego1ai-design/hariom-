import { OutboxPoller } from "@/lib/events/Outbox";
import { registerProductionConsumers } from "@/lib/events/ProductionConsumers";

export async function runEventsOutboxRecovery(maxRuntimeMs = 35_000) {
  registerProductionConsumers();

  const stopAt = Date.now() + Math.max(5_000, Math.min(maxRuntimeMs, 45_000));
  const reports = [];
  let totalDispatched = 0;
  let totalFailed = 0;
  let totalUnhandled = 0;

  for (let pass = 0; pass < 10 && Date.now() < stopAt; pass++) {
    const report = await OutboxPoller.pollAndProcess(50, 60_000, stopAt);
    reports.push(report);
    totalDispatched += report.dispatched;
    totalFailed += report.failed;
    totalUnhandled += report.unhandled;
    if (report.claimed === 0) break;
  }

  return {
    success: totalFailed === 0 && totalUnhandled === 0,
    totalDispatched,
    totalFailed,
    totalUnhandled,
    passes: reports.length,
    reports,
  };
}
