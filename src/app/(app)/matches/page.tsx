"use client";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/Modal";
import { useTable } from "@/lib/useData";
import { fmtDate } from "@/lib/labels";
import type { Match } from "@/lib/types";

export default function Matches() {
  const { rows, reload, sb } = useTable<Match>("matches", "match_date", false);
  const [f, setF] = useState<Partial<Match> | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    const { data } = await sb.from("matches").insert(f).select().single();
    if (data && f.match_date) {
      await sb.from("events").insert({ title: `${f.home ? "בית" : "חוץ"} מול ${f.opponent}`, kind: "match", starts_at: new Date(f.match_date + "T19:00").toISOString(), match_id: data.id });
    }
    setF(null); reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="h1">תיקי משחקים</h1>
        <button className="btn-primary" onClick={() => setF({ opponent: "", home: true, competition: "ליגת העל" })}>+ משחק</button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`} className="card flex items-center gap-3 hover:shadow-md">
            <div className="text-3xl">📁</div>
            <div className="flex-1">
              <div className="font-semibold">{m.home ? "בית" : "חוץ"} מול {m.opponent}</div>
              <div className="text-xs text-gray-500">מחזור {m.round || "-"} · {fmtDate(m.match_date)} · {m.competition}</div>
            </div>
            {m.goals_for != null && <div className="text-lg font-bold" dir="ltr">{m.goals_for}-{m.goals_against}</div>}
          </Link>))}
      </div>
      {rows.length === 0 && <p className="text-sm text-gray-500">אין עדיין משחקים.</p>}
      <Modal open={!!f} onClose={() => setF(null)} title="משחק חדש">
        {f && <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">יריבה</label><input className="input" required value={f.opponent} onChange={(e) => setF({ ...f, opponent: e.target.value })} /></div>
          <div><label className="label">מחזור</label><input className="input" value={f.round || ""} onChange={(e) => setF({ ...f, round: e.target.value })} /></div>
          <div><label className="label">תאריך</label><input className="input" type="date" value={f.match_date || ""} onChange={(e) => setF({ ...f, match_date: e.target.value })} /></div>
          <div><label className="label">בית/חוץ</label><select className="input" value={f.home ? "1" : "0"} onChange={(e) => setF({ ...f, home: e.target.value === "1" })}><option value="1">בית</option><option value="0">חוץ</option></select></div>
          <div><label className="label">מסגרת</label><input className="input" value={f.competition || ""} onChange={(e) => setF({ ...f, competition: e.target.value })} /></div>
          <button className="btn-primary col-span-2">יצירת תיק</button>
        </form>}
      </Modal>
    </div>
  );
}
