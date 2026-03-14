"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { loadId: string; offeredRate: number | null };

export function PlaceBidForm({ loadId, offeredRate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const amount = Number((form.querySelector('[name="amount"]') as HTMLInputElement)?.value);
    const message = (form.querySelector('[name="message"]') as HTMLInputElement)?.value?.trim() || undefined;
    if (amount < 0 || isNaN(amount)) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/carrier/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ load_id: loadId, amount, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to place bid");
        setLoading(false);
        return;
      }
      router.refresh();
      router.push("/dashboard/carrier/bids");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Place bid</h3>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-4">
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Your bid ($)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={offeredRate ?? undefined}
            className="w-full max-w-[140px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Message (optional)</label>
          <input
            id="message"
            name="message"
            type="text"
            placeholder="Notes for shipper"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Submitting…" : "Submit bid"}
      </button>
    </form>
  );
}
