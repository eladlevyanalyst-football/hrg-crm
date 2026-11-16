import { NextResponse } from "next/server";
import { Client } from "pg";
import { createAdminClient } from "@/lib/supabase/server";
import { SCHEMA_SQL } from "@/lib/schema";

export const maxDuration = 60;

/** Create the database tables (idempotent) using the direct Postgres URL, if one is configured. */
async function ensureSchema() {
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) return;
  const db = new Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/g, ""), ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    await db.query(SCHEMA_SQL);
    await db.query("notify pgrst, 'reload schema'");
  } finally {
    await db.end();
  }
}

export async function POST(req: Request) {
  const { full_name, email, password } = await req.json();
  const admin = createAdminClient();
  const { count, error: countErr } = await admin.from("profiles").select("*", { count: "exact", head: true });
  if (!countErr && (count ?? 0) > 0) return NextResponse.json({ error: "כבר קיים מנהל במערכת. בקש ממנו להוסיף אותך." }, { status: 403 });

  try {
    await ensureSchema();
  } catch (e) {
    return NextResponse.json({ error: "יצירת מסד הנתונים נכשלה: " + (e as Error).message }, { status: 500 });
  }
  await new Promise((r) => setTimeout(r, 1500)); // let the API pick up new tables

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return NextResponse.json({ error: error?.message || "שגיאה" }, { status: 400 });
  const { error: pErr } = await admin.from("profiles").insert({ id: data.user.id, full_name, role: "admin" });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: "הטבלאות עוד לא קיימות. הריצו את supabase/schema.sql ונסו שוב. (" + pErr.message + ")" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
