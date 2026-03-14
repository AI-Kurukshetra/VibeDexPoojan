import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function ShipperDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "shipper") redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Shipper Dashboard
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Welcome, {session.full_name ?? session.email}. Post loads and manage bids here.
      </p>
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Quick actions
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <Link
              href="/dashboard/shipper/loads"
              className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
            >
              My Loads
            </Link>
            <span className="ml-2 text-zinc-500">— view and post loads</span>
          </li>
          <li>
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              Post new load (coming soon)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
