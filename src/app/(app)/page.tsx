"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Crest from "@/components/Crest";
import { useMe, useSupabase } from "@/lib/useData";
import { PRIORITY, fmtDate, fmtTime, scoreColor, todayISO, wellnessScore } from "@/lib/labels";
import type { EventRow, Match, Player, Task, Wellness } from "@/lib/types";

const DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diffDays = (a: string, b: string) => Math.round((new Date(a + "T12:00").getTime() - new Date(b + "T12:00").getTime()) / 86400000);

export default function Home() {
  const sb = useSupabase();
  const me = useMe();
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [well, setWell] = useState<Wellness[]>([]);
  const [trainings, setTrainings] = useState(0);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const grid = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const end = new Date(grid[41]); end.setDate(end.getDate() + 1);

  useEffect(() => {
    sb.from("events").select("*").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at").then(({ data }) => setEvents(data || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, cursor]);
  useEffect(() => {
    const t = todayISO();
    sb.from("matches").select("*").order("match_date").then(({ data }) => setMatches(data || []));
    sb.from("players").select("*").eq("active", true).order("shirt_number").then(({ data }) => setPlayers(data || []));
    sb.from("wellness").select("*").eq("entry_date", t).then(({ data }) => setWell(data || []));
    sb.from("events").select("id", { count: "exact", head: true }).eq("kind", "training").lte("starts_at", new Date().toISOString()).gte("starts_at", "2026-07-01").then(({ count }) => setTrainings(count || 0));
  }, [sb]);
  useEffect(() => {
    if (me) sb.from("tasks").select("*").eq("assignee_id", me.id).neq("status", "done").order("due_date").then(({ data }) => setTasks(data || []));
  }, [sb, me]);

  const today = todayISO();
  const played = matches.filter((m) => m.goals_for != null && m.goals_against != null);
  const wins = played.filter((m) => m.goals_for! > m.goals_against!).length;
  const draws = played.filter((m) => m.goals_for === m.goals_against).length;
  const next = matches.find((m) => m.match_date && m.match_date >= today);
  const injured = players.filter((p) => p.availability === "injured").length;
  const keepers = players.filter((p) => p.position === "שוער").length;
  const matchDates = useMemo(() => matches.filter((m) => m.match_date).map((m) => m.match_date!) .sort(), [matches]);

  function mdLabel(day: string): { text: string; kind: "md" | "off" | "plus" | "minus" | "" } {
    if (events.some((e) => e.kind === "off" && ymd(new Date(e.starts_at)) === day)) return { text: "חופש", kind: "off" };
    if (matchDates.includes(day)) return { text: "MD", kind: "md" };
    const prev = [...matchDates].reverse().find((d) => d < day);
    const nxt = matchDates.find((d) => d > day);
    const p = prev ? diffDays(day, prev) : Infinity;
    const n = nxt ? diffDays(nxt, day) : Infinity;
    if (p <= 2 && p < n) return { text: `MD+${p}`, kind: "plus" };
    if (n !== Infinity && n <= 14) return { text: `MD-${n}`, kind: "minus" };
    if (p <= 7) return { text: `MD+${p}`, kind: "plus" };
    return { text: "", kind: "" };
  }
  const name = (id: string) => players.find((p) => p.id === id)?.full_name || "";
  const flagged = well.map((w) => ({ w, s: wellnessScore(w) })).filter((x) => x.s != null && x.s < 55);
  const stats: [string, number | string][] = [["שחקנים", players.length], ["שוערים", keepers], ["זמינים", players.length - injured], ["פצועים", injured], ["אימונים", trainings], ["משחקים", played.length], ["ניצחונות", wins], ["תיקו", draws], ["הפסדים", played.length - wins - draws]];

  return (
    <div className="space-y-4">
      <section className="flex items-center gap-6 rounded-md bg-ink px-6 py-5 text-white">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">הפועל רמת גן · מחלקה מקצועית · 26/27</div>
          <div className="mt-1 font-display text-4xl font-extrabold tracking-tight md:text-5xl">מרכז ביצועים</div>
          <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
            {stats.map(([l, v], i) => (
              <div key={l} className={i === 3 && Number(v) > 0 ? "text-brand" : ""}>
                <div className="font-display text-3xl font-bold leading-none">{v}</div>
                <div className="mt-1 text-[11px] font-semibold text-gray-400">{l}</div>
              </div>))}
          </div>
        </div>
        <div className="hidden md:block"><Crest size={84} /></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="btn-ghost px-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>→</button>
              <h2 className="h2 mb-0 min-w-36 text-center">{cursor.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}</h2>
              <button className="btn-ghost px-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>←</button>
            </div>
            <div className="flex gap-2"><button className="btn-ghost" onClick={() => setCursor(new Date())}>היום</button><Link href="/calendar" className="btn-dark">ללוח המלא</Link></div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => <div key={d} className="pb-1 text-center text-[11px] font-bold text-gray-400">{d}</div>)}
            {grid.map((d) => {
              const day = ymd(d);
              const out = d.getMonth() !== cursor.getMonth();
              const md = mdLabel(day);
              const m = matches.find((x) => x.match_date === day);
              const evs = events.filter((e) => ymd(new Date(e.starts_at)) === day && e.kind !== "off" && e.kind !== "match");
              const style = md.kind === "off" ? "bg-emerald-50 border-emerald-200" : md.kind === "md" ? "bg-ink text-white border-ink" : "bg-white border-gray-200";
              return (
                <div key={day} className={`min-h-[74px] rounded border p-1.5 ${style} ${out ? "opacity-35" : ""} ${day === today ? "ring-2 ring-brand ring-offset-1" : ""}`}>
                  <div className="flex items-center justify-between text-[11px]"><span className={md.kind === "md" ? "text-gray-300" : "text-gray-400"}>{d.getDate()}</span>
                    {md.kind === "md" && <span className="h-2 w-2 rounded-full bg-brand" />}</div>
                  <div className={`text-center font-display text-base font-bold leading-tight ${md.kind === "off" ? "text-emerald-700" : md.kind === "md" ? "text-white" : "text-ink"}`}>{md.text}</div>
                  {m && <div className="truncate text-center text-[10px] text-gray-300">{m.home ? "בית" : "חוץ"} · {m.opponent}</div>}
                  {evs.slice(0, 2).map((e) => <div key={e.id} className="truncate text-[10px] text-gray-500">{fmtTime(e.starts_at)} {e.title}</div>)}
                </div>);
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="card">
            <div className="panel-head">המשחק הבא</div>
            {next ? (
              <Link href={`/matches/${next.id}`} className="flex items-center gap-3">
                <Crest size={34} />
                <div className="flex-1">
                  <div className="font-display text-xl font-bold">{next.home ? "הפועל ר״ג – " + next.opponent : next.opponent + " – הפועל ר״ג"}</div>
                  <div className="text-xs text-gray-500">{new Date(next.match_date! + "T12:00").toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })} · מחזור {next.round || "-"} · {next.home ? "בית" : "חוץ"}</div>
                </div>
              </Link>
            ) : <p className="text-sm text-gray-500">לא הוזן משחק עתידי. <Link className="underline" href="/matches">הוספת משחק</Link></p>}
            {next && <div className="mt-3 flex gap-2"><Link href={`/matches/${next.id}`} className="btn-ghost text-xs">תיק המשחק</Link><Link href="/lineup" className="btn-ghost text-xs">הרכב</Link></div>}
          </section>

          <section className="card">
            <div className="panel-head">וולבינג היום</div>
            <div className="flex items-end gap-2"><span className="num text-4xl">{well.length}</span><span className="pb-1 text-sm text-gray-500">/ {players.length} מילאו</span></div>
            {flagged.length > 0 && <div className="mt-2 space-y-1">{flagged.map(({ w, s }) => (
              <div key={w.id} className="flex justify-between text-sm"><span>{name(w.player_id)}</span><span className={`chip ${scoreColor(s)}`}>{s}%</span></div>))}</div>}
            <Link href="/wellness?view=wellness" className="mt-2 block text-xs font-semibold text-brand">לכל הנתונים ←</Link>
          </section>

          <section className="card">
            <div className="panel-head">המשימות שלי</div>
            {tasks.length === 0 && <p className="text-sm text-gray-500">אין משימות פתוחות</p>}
            <ul className="space-y-1.5">{tasks.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{t.title}</span>
                <span className="flex shrink-0 gap-1">{t.priority === "high" && <span className={`chip ${PRIORITY.high.color}`}>דחוף</span>}<span className="text-xs text-gray-400">{fmtDate(t.due_date)}</span></span>
              </li>))}</ul>
            <Link href="/tasks" className="mt-2 block text-xs font-semibold text-brand">ללוח המשימות ←</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
