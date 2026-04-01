import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "output/creatives");

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let lastRun:      string | null = null;
    let totalFiles    = 0;
    let lastFilename: string | null = null;

    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => [".jpg",".jpeg",".webp",".png",".mp4",".md"].includes(path.extname(f).toLowerCase()))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(OUTPUT_DIR, f)).mtime }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      totalFiles   = files.length;
      lastFilename = files[0]?.name ?? null;
      lastRun      = files[0]?.mtime.toISOString() ?? null;
    }

    // Next scheduled run (6 hours after last run)
    const nextRun = lastRun
      ? new Date(new Date(lastRun).getTime() + 6 * 60 * 60 * 1000).toISOString()
      : null;

    const now      = Date.now();
    const lastMs   = lastRun ? new Date(lastRun).getTime() : null;
    const nextMs   = nextRun ? new Date(nextRun).getTime() : null;

    // Worker is "healthy" if last run was within 7 hours
    const healthy  = lastMs ? (now - lastMs) < 7 * 60 * 60 * 1000 : false;
    const minutesUntilNext = nextMs ? Math.max(0, Math.round((nextMs - now) / 60000)) : null;

    return NextResponse.json({
      healthy,
      lastRun,
      nextRun,
      minutesUntilNext,
      totalFiles,
      lastFilename,
      outputDir: OUTPUT_DIR,
    });
  } catch (err) {
    console.error("Worker status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
