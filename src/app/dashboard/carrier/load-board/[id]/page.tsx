import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { PlaceBidForm } from "./PlaceBidForm";

export default async function LoadBoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "carrier") redirect("/dashboard");

  const supabase = await createClient();
  const { data: load, error } = await supabase
    .from("loads")
    .select(`
      id,
      status,
      offered_rate,
      weight_lbs,
      description,
      pickup_after,
      deliver_by,
      created_at,
      origin_location_id,
      dest_location_id,
      equipment_type_id
    `)
    .eq("id", id)
    .single();

  if (error || !load) notFound();

  const isPosted = load.status === "posted";

  const [origin, dest, equipment, carrierRow] = await Promise.all([
    supabase.from("locations").select("address, city, state, zip").eq("id", load.origin_location_id).single(),
    supabase.from("locations").select("address, city, state, zip").eq("id", load.dest_location_id).single(),
    supabase.from("equipment_types").select("name").eq("id", load.equipment_type_id).single(),
    supabase.from("carriers").select("id").eq("user_id", session.id).single(),
  ]);

  let bid: { id: string; amount: number; status: string } | null = null;
  if (carrierRow.data?.id) {
    const bidRes = await supabase
      .from("bids")
      .select("id, amount, status")
      .eq("load_id", id)
      .eq("carrier_id", carrierRow.data.id)
      .maybeSingle();
    bid = bidRes.data;
  }

  const originLoc = origin.data;
  const destLoc = dest.data;
  const equipmentName = equipment.data?.name ?? "—";

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Load details</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {bid ? "Your bid status below." : isPosted ? "Place your bid below." : "This load is no longer open for new bids."}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Origin</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {originLoc?.address}, {originLoc?.city}, {originLoc?.state} {originLoc?.zip}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Destination</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {destLoc?.address}, {destLoc?.city}, {destLoc?.state} {destLoc?.zip}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Equipment</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">{equipmentName}</dd>
          </div>
          {load.weight_lbs != null && (
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Weight</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{Number(load.weight_lbs).toLocaleString()} lbs</dd>
            </div>
          )}
          {load.offered_rate != null && (
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Offered rate</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">${Number(load.offered_rate).toLocaleString()}</dd>
            </div>
          )}
        </dl>
        {load.description && (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{load.description}</p>
        )}
      </div>

      <div className="mt-8">
        {bid ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            Your bid: <strong>${Number(bid.amount).toLocaleString()}</strong> — <span className="font-medium">{bid.status}</span>
          </p>
        ) : isPosted ? (
          <PlaceBidForm loadId={load.id} offeredRate={load.offered_rate} />
        ) : (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            This load has been assigned to another carrier.
          </p>
        )}
      </div>

      <p className="mt-8">
        <Link href="/dashboard/carrier/load-board" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">← Back to Load Board</Link>
      </p>
    </div>
  );
}
