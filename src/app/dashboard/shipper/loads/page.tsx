import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function ShipperLoadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "shipper") redirect("/dashboard");

  const supabase = await createClient();
  const { data: loads } = await supabase
    .from("loads")
    .select("id, status, offered_rate, created_at")
    .eq("created_by", session.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My Loads
        </h1>
        <Link
          href="/dashboard/shipper/loads/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Post load (coming soon)
        </Link>
      </div>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        View and manage your posted loads.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {!loads?.length ? (
          <p className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No loads yet. Post your first load when the form is ready.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loads.map((load) => (
              <li key={load.id} className="flex items-center justify-between px-6 py-4">
                <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  {load.id.slice(0, 8)}…
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                  {load.status}
                </span>
                {load.offered_rate != null && (
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    ${Number(load.offered_rate).toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4">
        <Link href="/dashboard/shipper" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Back to Shipper dashboard
        </Link>
      </p>
    </div>
  );
}
