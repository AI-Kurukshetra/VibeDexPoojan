import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function CarrierDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "carrier") redirect("/dashboard");

  const supabase = await createClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", session.id)
    .single();

  let totalBids = 0;
  let pendingBids = 0;
  let acceptedBids = 0;
  let rejectedBids = 0;

  if (carrier?.id) {
    const { data: bids } = await supabase
      .from("bids")
      .select("status")
      .eq("carrier_id", carrier.id);
    const list = bids ?? [];
    totalBids = list.length;
    pendingBids = list.filter((b) => b.status === "pending").length;
    acceptedBids = list.filter((b) => b.status === "accepted").length;
    rejectedBids = list.filter((b) => b.status === "rejected").length;
  }

  const statCards = [
    { label: "Total bids", value: totalBids, href: "/dashboard/carrier/bids", color: "bg-slate-500" },
    { label: "Pending", value: pendingBids, sub: "awaiting shipper", href: "/dashboard/carrier/bids", color: "bg-amber-500" },
    { label: "Accepted", value: acceptedBids, sub: "you got the load", href: "/dashboard/carrier/bids", color: "bg-emerald-600" },
    { label: "Rejected", value: rejectedBids, href: "/dashboard/carrier/bids", color: "bg-zinc-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 text-white shadow-lg dark:from-slate-900 dark:to-black">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome back, {session.full_name ?? session.email?.split("@")[0]}
        </h1>
        <p className="mt-2 text-slate-300">
          Find loads and manage your bids from here.
        </p>
      </div>

      {/* Stats */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Your bids
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className={`mb-2 h-1 w-8 rounded-full ${card.color}`} />
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {card.value}
              </p>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {card.label}
              </p>
              {card.sub && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{card.sub}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/carrier/load-board"
            className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-900/50">
              📋
            </span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Load Board</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Browse available loads and place bids.
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/carrier/bids"
            className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-900/50">
              💰
            </span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Bids</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                View your bids and their status (pending, accepted, rejected).
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
