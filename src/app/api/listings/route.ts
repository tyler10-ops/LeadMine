import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("listings")
      .select("id, address, city, state, zip, price, beds, baths, sqft, status, list_date, mls_number, notes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[listings] GET error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[listings] GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, unknown>;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { address, city, state, zip, price, beds, baths, sqft, status, list_date, mls_number, notes } = body as {
      address: string; city: string; state?: string; zip?: string;
      price?: number; beds?: number; baths?: number; sqft?: number;
      status?: string; list_date?: string; mls_number?: string; notes?: string;
    };

    if (!address || !city) {
      return NextResponse.json({ error: "address and city are required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("listings")
      .insert({ user_id: user.id, address, city, state: state ?? "CA", zip, price, beds, baths, sqft, status: status ?? "active", list_date, mls_number, notes })
      .select()
      .single();

    if (error) {
      console.error("[listings] POST error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[listings] POST:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[listings] DELETE:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
