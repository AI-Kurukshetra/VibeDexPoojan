"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { bidId: string; loadId: string };

export function AcceptRejectBid({ bidId, loadId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  async function accept() {
    setLoading("accept");
    try {
      const res = await fetch("/api/shipper/bids/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid_id: bidId, load_id: loadId }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    setLoading("reject");
    try {
      const res = await fetch("/api/shipper/bids/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid_id: bidId }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <span className="flex gap-2">
      <button
        type="button"
        onClick={accept}
        disabled={!!loading}
        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === "accept" ? "…" : "Accept"}
      </button>
      <button
        type="button"
        onClick={reject}
        disabled={!!loading}
        className="rounded bg-zinc-500 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
      >
        {loading === "reject" ? "…" : "Reject"}
      </button>
    </span>
  );
}
