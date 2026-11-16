import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

/** Admin adds a staff member (login + profile). */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "רק מנהל יכול להוסיף אנשי צוות" }, { status: 403 });
  const { full_name, email, password, job_title, role } = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return NextResponse.json({ error: error?.message || "שגיאה" }, { status: 400 });
  await admin.from("profiles").insert({ id: data.user.id, full_name, job_title, role: role === "admin" ? "admin" : "staff" });
  return NextResponse.json({ ok: true });
}

/** Admin removes a staff member. */
export async function DELETE(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "רק מנהל" }, { status: 403 });
  const { id } = await req.json();
  if (id === me.id) return NextResponse.json({ error: "אי אפשר למחוק את עצמך" }, { status: 400 });
  await createAdminClient().auth.admin.deleteUser(id);
  return NextResponse.json({ ok: true });
}
