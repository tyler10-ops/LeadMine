import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new NextResponse("Invalid link", { status: 400 });

  const supabase = createServiceClient();
  await supabase.from("prospects").update({
    unsubscribed:    true,
    unsubscribed_at: new Date().toISOString(),
    next_email_at:   null,
    stage:           "dead",
  }).eq("id", id);

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#000;color:#fff">
    <h2 style="color:#00FF88">You've been unsubscribed.</h2>
    <p style="color:#888">You won't hear from LeadMine again. Sorry to see you go.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
