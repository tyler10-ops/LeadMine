import { NextRequest, NextResponse } from "next/server";
import { getMiningQueue } from "@/lib/queue/queues";

/**
 * GET /api/mining/status?jobId=xxx
 * Get the current status and progress of a mining job.
 */
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId query parameter is required" },
        { status: 400 }
      );
    }

    const queue = getMiningQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return NextResponse.json({
      jobId: job.id,
      state,
      progress,
      result: state === "completed" ? result : undefined,
      failedReason: state === "failed" ? failedReason : undefined,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      processedAt: job.processedOn
        ? new Date(job.processedOn).toISOString()
        : null,
      finishedAt: job.finishedOn
        ? new Date(job.finishedOn).toISOString()
        : null,
    });
  } catch (err) {
    console.error("[api/mining/status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
