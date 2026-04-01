import { NextRequest, NextResponse } from "next/server";
import { getMiningQueue } from "@/lib/queue/queues";

/**
 * POST /api/mining/stop
 * Cancel a running or queued mining job.
 *
 * Body: { jobId }
 */
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
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

    if (state === "active") {
      // Move to failed state with a cancellation reason
      await job.moveToFailed(new Error("Cancelled by user"), "0");
      return NextResponse.json({ jobId, status: "cancelled" });
    }

    if (state === "waiting" || state === "delayed") {
      await job.remove();
      return NextResponse.json({ jobId, status: "removed" });
    }

    return NextResponse.json({
      jobId,
      status: state,
      message: `Job is already in "${state}" state`,
    });
  } catch (err) {
    console.error("[api/mining/stop]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
