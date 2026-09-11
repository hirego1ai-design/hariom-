import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/apiSecurity';
import { FailureRecoveryRunner } from '@/lib/workflows/FailureRecoveryRunner';
import { RecoveryWorkerState, requireRecoveryWorkerKey } from '@/lib/workflows/RecoveryWorkerState';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    requireRecoveryWorkerKey(request);
    const heartbeat = await RecoveryWorkerState.claim();
    if (!heartbeat) return NextResponse.json({ success: true, skipped: 'already_running' }, { status: 202 });
    try {
      const report = await FailureRecoveryRunner.runRecoveryPass();
      if (!(await RecoveryWorkerState.finish(heartbeat, report))) throw new ApiError('Worker lease expired; inspect recovery status.', 503);
      return NextResponse.json({ success: true, report }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      await RecoveryWorkerState.finish(heartbeat).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    requireRecoveryWorkerKey(request);
    const status = await RecoveryWorkerState.read();
    const healthy = !status.stale && (status.heartbeat?.state === 'completed' || status.heartbeat?.state === 'running');
    return NextResponse.json({ success: healthy, ...status }, {
      status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
