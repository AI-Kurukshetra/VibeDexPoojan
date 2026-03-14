import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ShipperDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "shipper") redirect("/dashboard");

  const supabase = await createClient();

  const { data: loads } = await supabase
    .from("loads")
    .select("id, status")
    .eq("created_by", session.id);

  const loadList = loads ?? [];
  const totalLoads = loadList.length;
  const posted = loadList.filter((l) => l.status === "posted").length;
  const assigned = loadList.filter((l) => l.status === "assigned").length;
  const inTransit = loadList.filter((l) => l.status === "in_transit").length;
  const delivered = loadList.filter((l) => l.status === "delivered").length;
  const draft = loadList.filter((l) => l.status === "draft").length;

  const loadIds = loadList.map((l) => l.id);
  let pendingBidsCount = 0;
  if (loadIds.length > 0) {
    const { count } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .in("load_id", loadIds)
      .eq("status", "pending");
    pendingBidsCount = count ?? 0;
  }

  const statCards = [
    { label: "Total loads", value: totalLoads, href: "/dashboard/shipper/loads", color: "bg-slate-500" },
    { label: "Posted", value: posted, sub: "on load board", href: "/dashboard/shipper/loads?status=posted", color: "bg-blue-500" },
    { label: "Pending bids", value: pendingBidsCount, sub: "need review", href: "/dashboard/shipper/loads", color: "bg-amber-500" },
    { label: "Assigned", value: assigned, sub: "carrier assigned", href: "/dashboard/shipper/loads", color: "bg-emerald-600" },
    { label: "In transit", value: inTransit, href: "/dashboard/shipper/loads", color: "bg-violet-500" },
    { label: "Delivered", value: delivered, href: "/dashboard/shipper/loads", color: "bg-teal-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 text-white shadow-lg dark:from-slate-900 dark:to-black">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome back, {session.full_name ?? session.email?.split("@")[0]}
        </h1>
        <p className="mt-2 text-slate-300">
          Post loads and manage bids from here.
        </p>
      </div>

      {/* Stats */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            href="/dashboard/shipper/loads"
            className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-900/50">
              📦
            </span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">My Loads</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                View and manage your loads. Review bids and accept or reject.
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/shipper/loads/new"
            className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-900/50">
              ➕
            </span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Post new load</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create a load and publish to the load board for carriers to bid.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Draft hint */}
      {draft > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          You have <strong>{draft}</strong> draft load{draft !== 1 ? "s" : ""}.{" "}
          <Link href="/dashboard/shipper/loads" className="font-medium text-amber-800 underline dark:text-amber-200">
            View and post
          </Link>
        </div>
      )}
    </div>
  );
}
