"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe, useSupabase } from "@/lib/useData";
import { EVENT_KINDS, PRIORITY, fmtDate, fmtTime, scoreColor, todayISO, wellnessScore } from "@/lib/labels";
import type { EventRow, Match, Player, Task, Wellness } from "@/lib/types";

export default function Home() {
  const sb = useSupabase();
  const me = useMe();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [next, setNext] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [well, setWell] = useState<Wellness[]>([]);

  useEffect(() => {
    if (!me) return;
    const t = todayISO();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    sb.from("events").select("*").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at").then(({ data }) => setEvents(data || []));
    sb.from("tasks").select("*").eq("assignee_id", me.id).neq("status", "done").order("due_date").then(({ data }) => setTasks(data || []));
    sb.from("matches").select("*").gte("match_date", t).order("match_date").limit(1).then(({ data }) => setNext(data?.[0] || null));
    sb.from("players").select("*").eq("active", true).order("shirt_number").then(({ data }) => setPlayers(data || []));
    sb.from("wellness").select("*").eq("entry_date", t).then(({ data }) => setWell(data || []));
  }, [sb, me]);

  const filled = new Set(well.map((w) => w.player_id));
  const flagged = well.map((w) => ({ w, s: wellnessScore(w) })).filter((x) => x.s != null && x.s < 55);
  const name = (id: string) => players.find((p) => p.id === id)?.full_name || "";

  return (
    <div>
      <h1 className="h1">שלום {me?.full_name?.split(" ")[0] || ""} 👋</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="card">
          <h2 className="h2">המשחק הבא</h2>
          {next ? (
            <Link href={`/matches/${next.id}`} className="block">
              <div className="text-xl font-bold">{next.home ? "בית" : "חוץ"} מול {next.opponent}</div>
              <div className="text-sm text-gray-500">{fmtDate(next.match_date)} · מחזור {next.round || "-"}</div>
              <div className="mt-2 text-sm text-[var(--brand)]">לתיק המשחק ←</div>
            </Link>
          ) : <p className="text-sm text-gray-500">לא הוזן משחק עתידי. <Link className="underline" href="/matches">הוספת משחק</Link></p>}
        </div>

        <div className="card">
          <h2 className="h2">וולבינג היום</h2>
          <div className="text-3xl font-bold">{filled.size}<span className="text-base font-normal text-gray-500"> / {players.length} מילאו</span></div>
          {flagged.length > 0 && <div className="mt-2 space-y-1">
            <div className="text-xs font-medium text-red-700">דורשים תשומת לב:</div>
            {flagged.map(({ w, s }) => <div key={w.id} className="flex justify-between text-sm"><span>{name(w.player_id)}</span><span className={`chip ${scoreColor(s)}`}>{s}%</span></div>)}
          </div>}
          <Link href="/wellness" className="mt-2 block text-sm text-[var(--brand)]">לכל הנתונים ←</Link>
        </div>

        <div className="card">
          <h2 className="h2">המשימות שלי</h2>
          {tasks.length === 0 && <p className="text-sm text-gray-500">אין משימות פתוחות 🎉</p>}
          <ul className="space-y-1">{tasks.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center justify-between text-sm">
              <span>{t.title}</span>
              <span className="flex gap-1">{t.priority === "high" && <span className={`chip ${PRIORITY.high.color}`}>דחוף</span>}<span className="text-gray-400">{fmtDate(t.due_date)}</span></span>
            </li>))}</ul>
          <Link href="/tasks" className="mt-2 block text-sm text-[var(--brand)]">ללוח המשימות ←</Link>
        </div>

        <div className="card md:col-span-2 xl:col-span-3">
          <h2 className="h2">השבוע הקרוב</h2>
          {events.length === 0 && <p className="text-sm text-gray-500">אין אירועים. <Link className="underline" href="/calendar">ללוח השנה</Link></p>}
          <ul className="divide-y">{events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-28 text-gray-500">{new Date(e.starts_at).toLocaleDateString("he-IL", { weekday: "short", day: "2-digit", month: "2-digit" })} {fmtTime(e.starts_at)}</span>
              <span className={`chip ${EVENT_KINDS[e.kind]?.color}`}>{EVENT_KINDS[e.kind]?.label}</span>
              <span className="font-medium">{e.title}</span>
              {e.location && <span className="text-gray-400">· {e.location}</span>}
            </li>))}</ul>
        </div>
      </div>
    </div>
  );
}
