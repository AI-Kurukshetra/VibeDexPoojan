import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "shipper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bid_id: string; load_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.bid_id || !body.load_id) {
    return NextResponse.json({ error: "Missing bid_id or load_id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: load } = await supabase
    .from("loads")
    .select("id, created_by, company_id")
    .eq("id", body.load_id)
    .single();

  if (!load || load.created_by !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: bid } = await supabase
    .from("bids")
    .select("id, carrier_id, status")
    .eq("id", body.bid_id)
    .eq("load_id", body.load_id)
    .single();

  if (!bid || bid.status !== "pending") {
    return NextResponse.json({ error: "Bid not found or already handled" }, { status: 400 });
  }

  await supabase.from("bids").update({ status: "rejected" }).eq("load_id", body.load_id).neq("id", body.bid_id);
  await supabase.from("bids").update({ status: "accepted" }).eq("id", body.bid_id);

  const { error: shipErr } = await supabase.from("shipments").insert({
    load_id: body.load_id,
    carrier_id: bid.carrier_id,
    bid_id: body.bid_id,
    status: "assigned",
  });

  if (shipErr) {
    return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
  }

  await supabase.from("loads").update({ status: "assigned" }).eq("id", body.load_id);

  return NextResponse.json({ ok: true });
}
