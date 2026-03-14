"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Equipment = { id: string; code: string; name: string };

type Props = {
  companyId: string;
  createdBy: string;
  equipmentTypes: Equipment[];
};

export function PostLoadForm({ companyId, createdBy, equipmentTypes }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const origin = {
      address: (fd.get("origin_address") as string) || "",
      city: (fd.get("origin_city") as string) || "",
      state: (fd.get("origin_state") as string) || "",
      zip: (fd.get("origin_zip") as string) || "",
    };
    const dest = {
      address: (fd.get("dest_address") as string) || "",
      city: (fd.get("dest_city") as string) || "",
      state: (fd.get("dest_state") as string) || "",
      zip: (fd.get("dest_zip") as string) || "",
    };
    const equipmentTypeId = fd.get("equipment_type_id") as string;
    const weightLbs = fd.get("weight_lbs") ? Number(fd.get("weight_lbs")) : null;
    const offeredRate = fd.get("offered_rate") ? Number(fd.get("offered_rate")) : null;
    const pickupAfter = (fd.get("pickup_after") as string) || null;
    const deliverBy = (fd.get("deliver_by") as string) || null;
    const description = (fd.get("description") as string) || null;
    const status = (fd.get("status") as string) || "posted";

    try {
      const res = await fetch("/api/shipper/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          created_by: createdBy,
          origin,
          dest,
          equipment_type_id: equipmentTypeId,
          weight_lbs: weightLbs,
          offered_rate: offeredRate,
          pickup_after: pickupAfter || null,
          deliver_by: deliverBy || null,
          description: description || null,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create load");
        setLoading(false);
        return;
      }
      router.push("/dashboard/shipper/loads");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-medium text-zinc-900 dark:text-zinc-50">Origin</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input name="origin_address" className={inputClass} required placeholder="123 Main St" defaultValue="123 Main St" />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input name="origin_city" className={inputClass} required placeholder="Chicago" defaultValue="Chicago" />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input name="origin_state" className={inputClass} required placeholder="IL" maxLength={2} defaultValue="IL" />
          </div>
          <div>
            <label className={labelClass}>ZIP</label>
            <input name="origin_zip" className={inputClass} required placeholder="60601" defaultValue="60601" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-medium text-zinc-900 dark:text-zinc-50">Destination</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input name="dest_address" className={inputClass} required placeholder="456 Oak Ave" defaultValue="456 Oak Ave" />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input name="dest_city" className={inputClass} required placeholder="Dallas" defaultValue="Dallas" />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input name="dest_state" className={inputClass} required placeholder="TX" maxLength={2} defaultValue="TX" />
          </div>
          <div>
            <label className={labelClass}>ZIP</label>
            <input name="dest_zip" className={inputClass} required placeholder="75201" defaultValue="75201" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Equipment type</label>
          <select name="equipment_type_id" className={inputClass} required defaultValue={equipmentTypes[0]?.id ?? ""}>
            <option value="">Select</option>
            {equipmentTypes.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Weight (lbs)</label>
          <input name="weight_lbs" type="number" min={1} step={1} className={inputClass} placeholder="40000" defaultValue="40000" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Offered rate ($)</label>
          <input name="offered_rate" type="number" min={0} step={0.01} className={inputClass} placeholder="2500" defaultValue="2500" />
        </div>
        <div>
          <label className={labelClass}>Post as</label>
          <select name="status" className={inputClass}>
            <option value="posted">Posted (visible on load board)</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Pickup after</label>
          <input name="pickup_after" type="datetime-local" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Deliver by</label>
          <input name="deliver_by" type="datetime-local" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description (optional)</label>
        <textarea name="description" rows={2} className={inputClass} placeholder="Load details, notes..." />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Creating…" : "Create load"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
