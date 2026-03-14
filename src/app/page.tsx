import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseConfigured =
    Boolean(supabaseUrl) && supabaseUrl !== "https://your-project-ref.supabase.co";

  let dbTest: { ok: true; message: string } | { ok: false; error: string } = {
    ok: false,
    error: "Supabase not configured",
  };

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("connection_test")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        dbTest = { ok: false, error: error.message };
      } else if (data?.[0]?.message) {
        dbTest = { ok: true, message: data[0].message };
      } else {
        dbTest = { ok: false, error: "Run supabase/test-connection.sql first" };
      }
    } catch (e) {
      dbTest = {
        ok: false,
        error: e instanceof Error ? e.message : "Connection failed",
      };
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex max-w-2xl flex-col items-center gap-8 px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          VibeDex
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Digital Freight Marketplace & TMS
        </p>

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Project status
          </h2>
          <ul className="flex flex-col gap-2 text-left text-sm">
            <li className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-green-500"
                aria-hidden
              />
              Next.js (App Router)
            </li>
            <li className="flex items-center gap-2">
              {supabaseConfigured ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-green-500"
                    aria-hidden
                  />
                  Supabase configured
                </>
              ) : (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-amber-500"
                    aria-hidden
                  />
                  Supabase: add .env.local (see .env.example)
                </>
              )}
            </li>
            <li className="flex items-center gap-2">
              {dbTest.ok ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-green-500"
                    aria-hidden
                  />
                  DB connected — {dbTest.message}
                </>
              ) : (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-amber-500"
                    aria-hidden
                  />
                  DB: {dbTest.error}
                </>
              )}
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Next.js Docs
          </a>
          <a
            href="https://supabase.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Supabase Docs
          </a>
        </div>
      </main>
    </div>
  );
}
