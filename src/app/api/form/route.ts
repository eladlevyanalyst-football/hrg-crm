import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ok = (code: string | null) => !!process.env.FORM_CODE && code === process.env.FORM_CODE;
const int = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : null; };

/** Player list for the public form (names only). */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!ok(code)) return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  const { data } = await createAdminClient().from("players").select("id,full_name,shirt_number").eq("active", true).order("shirt_number");
  return NextResponse.json({ players: data || [] });
}

/** Save a wellness and/or RPE entry from a player. */
export async function POST(req: Request) {
  const b = await req.json();
  if (!ok(b.code)) return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  if (!b.player_id) return NextResponse.json({ error: "חסר שחקן" }, { status: 400 });
  const sb = createAdminClient();
  const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : new Date().toISOString().slice(0, 10);

  if (b.kind === "wellness") {
    // one wellness entry per player per day: replace earlier one
    await sb.from("wellness").delete().eq("player_id", b.player_id).eq("entry_date", date);
    const { error } = await sb.from("wellness").insert({
      player_id: b.player_id, entry_date: date,
      sleep_hours: b.sleep_hours === "" || b.sleep_hours == null ? null : Math.min(Math.max(Number(b.sleep_hours), 0), 16),
      sleep_quality: int(b.sleep_quality, 1, 5), fatigue: int(b.fatigue, 1, 5), soreness: int(b.soreness, 1, 5),
      stress: int(b.stress, 1, 5), mood: int(b.mood, 1, 5), notes: String(b.notes || "").slice(0, 500),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const rpe = int(b.rpe, 1, 10), duration = int(b.duration_min, 1, 300);
    if (!rpe || !duration) return NextResponse.json({ error: "חסר RPE או דקות" }, { status: 400 });
    const { error } = await sb.from("rpe").insert({
      player_id: b.player_id, entry_date: date, session_type: ["training", "match", "gym", "other"].includes(b.session_type) ? b.session_type : "training",
      rpe, duration_min: duration, notes: String(b.notes || "").slice(0, 500),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
