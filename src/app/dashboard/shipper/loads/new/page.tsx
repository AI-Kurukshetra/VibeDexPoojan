import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostLoadForm } from "./PostLoadForm";

export default async function NewLoadPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "shipper") redirect("/dashboard");

  const supabase = await createClient();
  let { data: userRow } = await supabase
    .from("app_users")
    .select("company_id")
    .eq("id", session.id)
    .single();

  let companyId = userRow?.company_id ?? null;

  if (!companyId) {
    const admin = createAdminClient();
    const companyName = session.full_name ? `${session.full_name}'s Company` : "My Company";
    const { data: newCompany, error: companyErr } = await admin
      .from("companies")
      .insert({ name: companyName, type: "shipper" })
      .select("id")
      .single();
    if (companyErr || !newCompany) {
      return (
        <div>
          <p className="text-amber-600 dark:text-amber-400">Could not create company. Try again or contact admin.</p>
          <Link href="/dashboard/shipper/loads" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">← My Loads</Link>
        </div>
      );
    }
    await admin.from("app_users").update({ company_id: newCompany.id }).eq("id", session.id);
    companyId = newCompany.id;
  }

  const { data: equipmentTypes } = await supabase
    .from("equipment_types")
    .select("id, code, name")
    .order("code");

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Post new load</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Enter origin, destination, and load details.</p>
      <div className="mt-6">
        <PostLoadForm
          companyId={companyId}
          createdBy={session.id}
          equipmentTypes={equipmentTypes ?? []}
        />
      </div>
      <p className="mt-6">
        <Link href="/dashboard/shipper/loads" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">← Back to My Loads</Link>
      </p>
    </div>
  );
}
