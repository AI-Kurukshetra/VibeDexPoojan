import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "carrier") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { load_id: string; amount: number; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.load_id || body.amount == null || body.amount < 0) {
    return NextResponse.json({ error: "Missing load_id or invalid amount" }, { status: 400 });
  }

  const supabase = await createClient();

  let { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", session.id)
    .single();

  if (!carrier) {
    const { data: userRow } = await supabase
      .from("app_users")
      .select("company_id")
      .eq("id", session.id)
      .single();
    const { data: newCarrier, error: insertErr } = await supabase
      .from("carriers")
      .insert({ user_id: session.id, company_id: userRow?.company_id ?? null })
      .select("id")
      .single();
    if (insertErr || !newCarrier) {
      return NextResponse.json({ error: insertErr?.message || "Failed to create carrier profile" }, { status: 500 });
    }
    carrier = newCarrier;
  }

  const { data: load } = await supabase
    .from("loads")
    .select("id")
    .eq("id", body.load_id)
    .eq("status", "posted")
    .single();

  if (!load) {
    return NextResponse.json({ error: "Load not found or not available for bid" }, { status: 404 });
  }

  const { error: bidErr } = await supabase.from("bids").insert({
    load_id: body.load_id,
    carrier_id: carrier.id,
    amount: body.amount,
    message: body.message ?? null,
    status: "pending",
  });

  if (bidErr) {
    if (bidErr.code === "23505") return NextResponse.json({ error: "You already bid on this load" }, { status: 400 });
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
