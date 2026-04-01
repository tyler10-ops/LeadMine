import { NextRequest, NextResponse } from "next/server";
import { getMiningQueue } from "@/lib/queue/queues";

/**
 * GET /api/mining/stats
 * Get aggregate stats for the mining queue.
 */
export async function GET(_req: NextRequest) {
  try {
    const queue = getMiningQueue();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    // Get recent completed jobs for summary stats
    const recentJobs = await queue.getCompleted(0, 10);
    const recentResults = recentJobs
      .filter((j) => j.returnvalue)
      .map((j) => ({
        jobId: j.id,
        data: j.data,
        result: j.returnvalue,
        finishedAt: j.finishedOn
          ? new Date(j.finishedOn).toISOString()
          : null,
      }));

    return NextResponse.json({
      queue: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      },
      recentResults,
    });
  } catch (err) {
    console.error("[api/mining/stats]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
