import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, clearSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    await clearSession();
    redirect("/login");
  }

  const isShipper = session.role === "shipper";
  const isCarrier = session.role === "carrier";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            VibeDex
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {session.full_name ?? session.email} ({session.role})
            </span>
            {isShipper && (
              <Link
                href="/dashboard/shipper"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Shipper
              </Link>
            )}
            {isCarrier && (
              <Link
                href="/dashboard/carrier"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                Carrier
              </Link>
            )}
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
