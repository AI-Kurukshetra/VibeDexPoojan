import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "carrier") redirect("/dashboard/carrier");
  redirect("/dashboard/shipper");
}
