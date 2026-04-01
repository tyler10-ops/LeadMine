/**
 * POST /api/demo/call  — start a demo outbound call (no auth required)
 * GET  /api/demo/call?id=xxx — poll call status from Vapi
 */

import { NextRequest, NextResponse } from "next/server";
import { initiateVapiCall, getVapiCall } from "@/lib/calling/vapi";

export async function POST(request: NextRequest) {
  try {
    const { phone, name, intent, realtorName, realtorBusiness } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const vapiCall = await initiateVapiCall({
      leadPhone: phone,
      leadName: name || "there",
      leadIntent: intent || "unknown",
      realtorName: realtorName || "your agent",
      realtorBusiness: realtorBusiness || "LeadMine Realty",
      callRecordId: `demo-${Date.now()}`,
      webhookUrl: `${appUrl}/api/calling/webhook`,
    });

    return NextResponse.json({
      vapi_call_id: vapiCall.id,
      status: vapiCall.status,
    });
  } catch (err) {
    console.error("[demo/call POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start call" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const call = await getVapiCall(id);

    return NextResponse.json({
      status: call.status,
      duration: call.duration,
      cost: call.cost,
      endedAt: call.endedAt,
    });
  } catch (err) {
    console.error("[demo/call GET]", err);
    return NextResponse.json({ error: "Failed to fetch call status" }, { status: 500 });
  }
}
