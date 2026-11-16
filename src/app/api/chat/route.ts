import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const iso = (daysAgo: number) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);

/** Snapshot of the team's data as plain text for the model. */
async function buildContext(sb: Awaited<ReturnType<typeof createClient>>) {
  const [players, well, rpe, events, tasks, staff, matches, files, scouts, reports, imports] = await Promise.all([
    sb.from("players").select("id,full_name,shirt_number,position,birth_date,nationality,foot,contract_until,height_cm,weight_kg,notes,active"),
    sb.from("wellness").select("player_id,entry_date,sleep_hours,sleep_quality,fatigue,soreness,stress,mood,notes").gte("entry_date", iso(14)).order("entry_date"),
    sb.from("rpe").select("player_id,entry_date,session_type,rpe,duration_min,load").gte("entry_date", iso(28)).order("entry_date"),
    sb.from("events").select("title,kind,starts_at,location").gte("starts_at", iso(7)).lte("starts_at", iso(-21)).order("starts_at"),
    sb.from("tasks").select("title,status,due_date,priority,assignee_id").neq("status", "done"),
    sb.from("profiles").select("id,full_name,job_title"),
    sb.from("matches").select("id,round,opponent,match_date,home,goals_for,goals_against,notes").order("match_date"),
    sb.from("match_files").select("match_id,category,title"),
    sb.from("scouting_players").select("id,full_name,club,position,birth_year,nationality,status,rating,notes"),
    sb.from("scouting_reports").select("scouting_player_id,report_date,rating,body").order("report_date", { ascending: false }).limit(60),
    sb.from("data_imports").select("source,title,data_date,columns,rows").order("data_date", { ascending: false }).limit(6),
  ]);
  const pName = Object.fromEntries((players.data || []).map((p) => [p.id, p.full_name]));
  const sName = Object.fromEntries((staff.data || []).map((p) => [p.id, p.full_name]));
  const scName = Object.fromEntries((scouts.data || []).map((p) => [p.id, p.full_name]));
  const parts: string[] = [];
  parts.push(`היום: ${new Date().toISOString().slice(0, 10)}`);
  parts.push("## סגל\n" + (players.data || []).map((p) => `${p.shirt_number ?? ""} ${p.full_name} | ${p.position ?? ""} | לידה ${p.birth_date ?? ""} | ${p.nationality ?? ""} | רגל ${p.foot ?? ""} | חוזה עד ${p.contract_until ?? ""} | ${p.active ? "פעיל" : "לא פעיל"}${p.notes ? " | " + clip(p.notes, 120) : ""}`).join("\n"));
  parts.push("## וולבינג 14 ימים (1 גרוע עד 5 מצוין: איכות שינה, אנרגיה, שרירים, לחץ, מצב רוח)\n" + (well.data || []).map((w) => `${w.entry_date} ${pName[w.player_id]}: שינה ${w.sleep_hours ?? "-"}ש׳ | ${w.sleep_quality},${w.fatigue},${w.soreness},${w.stress},${w.mood}${w.notes ? " | " + clip(w.notes, 80) : ""}`).join("\n"));
  parts.push("## RPE 28 ימים (עומס = RPE × דקות)\n" + (rpe.data || []).map((r) => `${r.entry_date} ${pName[r.player_id]}: ${r.session_type} RPE ${r.rpe} × ${r.duration_min}′ = ${r.load}`).join("\n"));
  parts.push("## לו״ז\n" + (events.data || []).map((e) => `${e.starts_at.slice(0, 16)} ${e.kind} ${e.title}${e.location ? " @ " + e.location : ""}`).join("\n"));
  parts.push("## משימות פתוחות\n" + (tasks.data || []).map((t) => `${t.title} | ${t.status} | ${sName[t.assignee_id as string] || "לא משויך"} | יעד ${t.due_date ?? "-"} | ${t.priority}`).join("\n"));
  parts.push("## משחקים\n" + (matches.data || []).map((m) => {
    const fl = (files.data || []).filter((f) => f.match_id === m.id).map((f) => `${f.category}:${clip(f.title, 40)}`);
    return `מחזור ${m.round ?? ""} ${m.match_date ?? ""} ${m.home ? "בית" : "חוץ"} מול ${m.opponent} ${m.goals_for != null ? `${m.goals_for}-${m.goals_against}` : ""}${m.notes ? " | " + clip(m.notes, 150) : ""}${fl.length ? " | קבצים: " + fl.slice(0, 15).join(", ") : ""}`;
  }).join("\n"));
  parts.push("## סקאוטינג\n" + (scouts.data || []).map((s) => `${s.full_name} | ${s.club ?? ""} | ${s.position ?? ""} | ${s.birth_year ?? ""} | ${s.status} | ציון ${s.rating ?? "-"}${s.notes ? " | " + clip(s.notes, 120) : ""}`).join("\n"));
  parts.push("## דוחות סקאוטינג אחרונים\n" + (reports.data || []).map((r) => `${r.report_date} ${scName[r.scouting_player_id]} (${r.rating ?? "-"}): ${clip(r.body || "", 300)}`).join("\n"));
  for (const imp of imports.data || []) {
    const cols = (imp.columns as string[]).slice(0, 25);
    const rows = (imp.rows as Record<string, unknown>[]).slice(0, 60).map((r) => cols.map((c) => String(r[c] ?? "")).join(" | "));
    parts.push(`## נתונים: ${imp.title} (${imp.source}, ${imp.data_date ?? ""})\n${cols.join(" | ")}\n${rows.join("\n")}`);
  }
  return clip(parts.join("\n\n"), 400_000);
}

const SYSTEM = `אתה העוזר של הצוות המקצועי של קבוצת כדורגל. ענה בעברית, קצר וברור, על סמך נתוני המערכת שמופיעים למטה.
אם התשובה לא נמצאת בנתונים, אמור זאת במפורש ואל תמציא מספרים. כשאתה מציין מספרים, ציין מאיזה תאריך או קובץ הם.`;

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "צ'אט ה-AI עוד לא הופעל (חסר מפתח ANTHROPIC_API_KEY)" }, { status: 500 });

  const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };
  const context = await buildContext(sb);

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: "# נתוני המערכת\n" + context, cache_control: { type: "ephemeral" } },
      ],
      messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    });
    if (response.stop_reason === "refusal") return NextResponse.json({ answer: "לא הצלחתי לענות על השאלה הזו." });
    const answer = response.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    return NextResponse.json({ answer: answer || "לא התקבלה תשובה." });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "יותר מדי בקשות, נסו שוב בעוד דקה" }, { status: 429 });
    if (error instanceof Anthropic.APIError) return NextResponse.json({ error: `שגיאת AI (${error.status})` }, { status: 502 });
    throw error;
  }
}
