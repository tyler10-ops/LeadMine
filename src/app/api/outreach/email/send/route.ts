import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

const FROM = process.env.RESEND_FROM_EMAIL ?? "LeadMine <hello@leadmine.io>";

export async function POST(request: NextRequest) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email not configured — add RESEND_API_KEY to Vercel env vars" },
      { status: 503 }
    );
  }

  let body: { draftId: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { draftId } = body;
  if (!draftId) return NextResponse.json({ error: "draftId required" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: draft } = await supabase
    .from("outreach_drafts")
    .select("id, lead_id, subject, body, channel, status")
    .eq("id", draftId)
    .single();

  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (draft.channel !== "email") return NextResponse.json({ error: "Not an email draft" }, { status: 400 });
  if (draft.status === "sent") return NextResponse.json({ error: "Already sent" }, { status: 409 });

  const { data: lead } = await supabase
    .from("leads")
    .select("id, owner_name, email")
    .eq("id", draft.lead_id)
    .single();

  if (!lead?.email) {
    return NextResponse.json({ error: "Lead has no email address on file" }, { status: 422 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data: sent, error: resendErr } = await resend.emails.send({
    from:    FROM,
    to:      lead.email,
    subject: draft.subject ?? "A note from your local market expert",
    text:    draft.body,
  });

  if (resendErr) {
    console.error("[email/send] Resend error:", resendErr);
    return NextResponse.json({ error: resendErr.message }, { status: 502 });
  }

  await Promise.all([
    supabase.from("outreach_drafts")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", draftId),

    supabase.from("activity_log").insert({
      user_id:     user.id,
      event_type:  "email_sent",
      title:       `Email sent to ${lead.owner_name ?? lead.email}`,
      description: draft.subject ?? "",
      icon:        "mail",
      severity:    "success",
      metadata:    { draftId, leadId: lead.id, resendId: sent?.id },
    }),
  ]);

  return NextResponse.json({ success: true, resendId: sent?.id });
}
