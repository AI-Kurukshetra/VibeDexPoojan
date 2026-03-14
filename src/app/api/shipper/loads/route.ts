import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "shipper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    company_id: string;
    created_by: string;
    origin: { address: string; city: string; state: string; zip: string };
    dest: { address: string; city: string; state: string; zip: string };
    equipment_type_id: string;
    weight_lbs: number | null;
    offered_rate: number | null;
    pickup_after: string | null;
    deliver_by: string | null;
    description: string | null;
    status: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.company_id ||
    !body.created_by ||
    !body.origin?.city ||
    !body.origin?.state ||
    !body.origin?.zip ||
    !body.dest?.city ||
    !body.dest?.state ||
    !body.dest?.zip ||
    !body.equipment_type_id
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (body.created_by !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: originLoc, error: originErr } = await supabase
    .from("locations")
    .insert({
      company_id: body.company_id,
      address: body.origin.address || body.origin.city,
      city: body.origin.city,
      state: body.origin.state,
      zip: body.origin.zip,
      country: "US",
    })
    .select("id")
    .single();

  if (originErr || !originLoc) {
    return NextResponse.json({ error: originErr?.message || "Failed to create origin location" }, { status: 500 });
  }

  const { data: destLoc, error: destErr } = await supabase
    .from("locations")
    .insert({
      company_id: body.company_id,
      address: body.dest.address || body.dest.city,
      city: body.dest.city,
      state: body.dest.state,
      zip: body.dest.zip,
      country: "US",
    })
    .select("id")
    .single();

  if (destErr || !destLoc) {
    return NextResponse.json({ error: destErr?.message || "Failed to create destination location" }, { status: 500 });
  }

  const pickupAfter = body.pickup_after ? new Date(body.pickup_after).toISOString() : null;
  const deliverBy = body.deliver_by ? new Date(body.deliver_by).toISOString() : null;
  const status = ["draft", "posted"].includes(body.status) ? body.status : "posted";

  const { data: load, error: loadErr } = await supabase
    .from("loads")
    .insert({
      company_id: body.company_id,
      created_by: body.created_by,
      origin_location_id: originLoc.id,
      dest_location_id: destLoc.id,
      equipment_type_id: body.equipment_type_id,
      weight_lbs: body.weight_lbs ?? null,
      offered_rate: body.offered_rate ?? null,
      description: body.description ?? null,
      status,
      pickup_after: pickupAfter,
      deliver_by: deliverBy,
    })
    .select("id")
    .single();

  if (loadErr || !load) {
    return NextResponse.json({ error: loadErr?.message || "Failed to create load" }, { status: 500 });
  }

  return NextResponse.json({ id: load.id });
}
