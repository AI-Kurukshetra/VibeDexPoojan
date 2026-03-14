import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    const supabase = createAdminClient();
    const { data: row, error } = await supabase
      .from("app_users")
      .select("id, email, full_name, role, password")
      .eq("email", email)
      .single();

    if (error || !row || row.password !== password) {
      return NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 }
      );
    }

    await setSession({
      id: row.id,
      email: row.email,
      full_name: row.full_name ?? null,
      role: row.role as "shipper" | "carrier" | "admin",
    });

    return NextResponse.json({
      ok: true,
      role: row.role,
      redirect: row.role === "carrier" ? "/dashboard/carrier" : "/dashboard/shipper",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
