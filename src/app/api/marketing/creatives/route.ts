import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "output/creatives");

export interface CreativeFile {
  id:          string;
  filename:    string;
  type:        "image" | "video" | "article";
  platform?:   string;
  headline?:   string;
  body?:       string;
  cta?:        string;
  angle?:      string;
  imageUrl?:   string;
  videoUrl?:   string;
  articleMd?:  string;
  createdAt:   string;
  source:      "file" | "supabase";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const results: CreativeFile[] = [];

    // ── 1. Read from local output/creatives directory ──────────────────────
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR).sort().reverse();

      for (const filename of files) {
        const ext = path.extname(filename).toLowerCase();
        if (![".jpg", ".jpeg", ".webp", ".png", ".mp4", ".md"].includes(ext)) continue;

        const stat = fs.statSync(path.join(OUTPUT_DIR, filename));
        const id   = path.basename(filename, ext);

        if (ext === ".md") {
          const content = fs.readFileSync(path.join(OUTPUT_DIR, filename), "utf-8");
          const headline = content.split("\n")[0].replace(/^#+\s*/, "").trim();
          results.push({
            id,
            filename,
            type:      "article",
            headline,
            articleMd: content,
            createdAt: stat.mtime.toISOString(),
            source:    "file",
          });
        } else if (ext === ".mp4") {
          results.push({
            id,
            filename,
            type:      "video",
            createdAt: stat.mtime.toISOString(),
            source:    "file",
          });
        } else {
          results.push({
            id,
            filename,
            type:      "image",
            createdAt: stat.mtime.toISOString(),
            source:    "file",
          });
        }
      }
    }

    // ── 2. Merge Supabase ad_creatives (if table exists) ──────────────────
    const { data: dbCreatives } = await supabase
      .from("ad_creatives")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dbCreatives) {
      for (const row of dbCreatives) {
        // Skip if already in file list by matching id
        const alreadyHave = results.some(r => r.id === row.id);
        if (alreadyHave) continue;

        const images = Array.isArray(row.images) ? row.images : [];
        const copy   = row.copy ?? {};

        results.push({
          id:        row.id,
          filename:  `${row.id}.jpg`,
          type:      "image",
          platform:  row.equity_band,
          headline:  copy.headlines?.[0],
          body:      copy.primaryText?.[0],
          cta:       copy.ctas?.[0],
          angle:     row.lead_type,
          imageUrl:  images[0]?.url,
          createdAt: row.created_at,
          source:    "supabase",
        });
      }
    }

    // Sort all by createdAt desc
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ creatives: results, total: results.length });
  } catch (err) {
    console.error("Creatives API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
