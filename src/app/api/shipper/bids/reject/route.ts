import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "shipper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bid_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.bid_id) return NextResponse.json({ error: "Missing bid_id" }, { status: 400 });

  const supabase = await createClient();

  const { data: bid } = await supabase
    .from("bids")
    .select("id, load_id")
    .eq("id", body.bid_id)
    .single();

  if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 });

  const { data: load } = await supabase
    .from("loads")
    .select("created_by")
    .eq("id", bid.load_id)
    .single();

  if (!load || load.created_by !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.from("bids").update({ status: "rejected" }).eq("id", body.bid_id);

  return NextResponse.json({ ok: true });
}
