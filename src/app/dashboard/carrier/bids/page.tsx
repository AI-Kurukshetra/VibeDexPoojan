import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function MyBidsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "carrier") redirect("/dashboard");

  const supabase = await createClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", session.id)
    .single();

  if (!carrier) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Bids</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No carrier profile yet. Place a bid on a load to get started.</p>
        <Link href="/dashboard/carrier/load-board" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">← Load Board</Link>
      </div>
    );
  }

  const { data: bids } = await supabase
    .from("bids")
    .select(`
      id,
      amount,
      message,
      status,
      created_at,
      load_id,
      loads (id, status, offered_rate)
    `)
    .eq("carrier_id", carrier.id)
    .order("created_at", { ascending: false });

  const bidsWithLoad = (bids ?? []).map((b) => ({
    id: b.id,
    amount: b.amount,
    message: b.message,
    status: b.status,
    created_at: b.created_at,
    load_id: b.load_id,
    load: b.loads
      ? {
          id: (b.loads as { id: string }).id,
          status: (b.loads as { status: string }).status,
          offered_rate: (b.loads as { offered_rate: number | null }).offered_rate,
        }
      : null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Bids</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Bids you have placed on loads.</p>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {!bidsWithLoad.length ? (
          <p className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No bids yet. <Link href="/dashboard/carrier/load-board" className="font-medium text-zinc-700 hover:underline dark:text-zinc-300">Browse Load Board</Link> to place a bid.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {bidsWithLoad.map((b) => (
              <li key={b.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      ${Number(b.amount).toLocaleString()}
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                        {b.status}
                      </span>
                    </p>
                    {b.load?.offered_rate != null && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Load offered ${Number(b.load.offered_rate).toLocaleString()}</span>
                    )}
                    {b.message && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{b.message}</p>}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  {b.load && (
                    <Link
                      href={`/dashboard/carrier/load-board/${b.load.id}`}
                      className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      View load →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-6">
        <Link href="/dashboard/carrier" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">← Back to Carrier dashboard</Link>
      </p>
    </div>
  );
}
