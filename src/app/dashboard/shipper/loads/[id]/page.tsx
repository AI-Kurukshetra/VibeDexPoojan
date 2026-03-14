import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { AcceptRejectBid } from "./AcceptRejectBid";

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "shipper") redirect("/dashboard");

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
      equipment_type_id,
      company_id,
      created_by
    `)
    .eq("id", id)
    .single();

  if (error || !load || load.created_by !== session.id) notFound();

  const [origin, dest, equipment, bidsResult, shipment] = await Promise.all([
    supabase.from("locations").select("address, city, state, zip").eq("id", load.origin_location_id).single(),
    supabase.from("locations").select("address, city, state, zip").eq("id", load.dest_location_id).single(),
    supabase.from("equipment_types").select("name").eq("id", load.equipment_type_id).single(),
    supabase.from("bids").select("id, amount, message, status, created_at").eq("load_id", id).order("created_at", { ascending: false }),
    supabase.from("shipments").select("id, status").eq("load_id", id).maybeSingle(),
  ]);

  const originLoc = origin.data;
  const destLoc = dest.data;
  const equipmentName = equipment.data?.name ?? "—";
  const bids = bidsResult.data ?? [];
  const hasShipment = !!shipment.data;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Load details</h1>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium dark:bg-zinc-800">
          {load.status}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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
          {load.pickup_after && (
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Pickup after</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{new Date(load.pickup_after).toLocaleString()}</dd>
            </div>
          )}
          {load.deliver_by && (
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Deliver by</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{new Date(load.deliver_by).toLocaleString()}</dd>
            </div>
          )}
        </dl>
        {load.description && (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{load.description}</p>
        )}
      </div>

      {/* Bids */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Bids</h2>
        {hasShipment ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">A carrier has been assigned. Shipment is in progress.</p>
        ) : !bids.length ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No bids yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bids.map((bid) => (
              <li
                key={bid.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">${Number(bid.amount).toLocaleString()}</span>
                  {bid.message && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{bid.message}</p>}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(bid.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{bid.status}</span>
                  {load.status === "posted" && bid.status === "pending" && (
                    <AcceptRejectBid bidId={bid.id} loadId={load.id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8">
        <Link href="/dashboard/shipper/loads" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">← Back to My Loads</Link>
      </p>
    </div>
  );
}
