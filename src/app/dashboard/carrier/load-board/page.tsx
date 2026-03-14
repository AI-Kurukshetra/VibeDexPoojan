import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function LoadBoardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "carrier") redirect("/dashboard");

  const supabase = await createClient();
  let { data: carrier } = await supabase.from("carriers").select("id").eq("user_id", session.id).single();
  if (!carrier) {
    const { data: userRow } = await supabase.from("app_users").select("company_id").eq("id", session.id).single();
    const { data: newCarrier } = await supabase
      .from("carriers")
      .insert({ user_id: session.id, company_id: userRow?.company_id ?? null })
      .select("id")
      .single();
    carrier = newCarrier ?? null;
  }

  const { data: loads } = await supabase
    .from("loads")
    .select("id, status, offered_rate, pickup_after, deliver_by, created_at")
    .eq("status", "posted")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Load Board
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Browse available loads and place bids.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {!loads?.length ? (
          <p className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No posted loads at the moment. Check back later.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loads.map((load) => (
              <li key={load.id}>
                <Link
                  href={`/dashboard/carrier/load-board/${load.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    {load.id.slice(0, 8)}…
                  </span>
                  {load.offered_rate != null && (
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      ${Number(load.offered_rate).toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    View & place bid →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4">
        <Link href="/dashboard/carrier" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to Carrier dashboard
        </Link>
      </p>
    </div>
  );
}
