"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useTable } from "@/lib/useData";
import { fmtDate } from "@/lib/labels";
import type { Match } from "@/lib/types";

export default function Matches() {
  const { rows, reload, sb } = useTable<Match>("matches", "match_date", false);
  const [f, setF] = useState<Partial<Match> | null>(null);
  const [comp, setComp] = useState("all");
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    sb.from("match_files").select("match_id").not("match_id", "is", null).then(({ data }) => {
      const c: Record<string, number> = {};
      (data || []).forEach((r: { match_id: string }) => { c[r.match_id] = (c[r.match_id] || 0) + 1; });
      setCounts(c);
    });
  }, [sb, rows.length]);
  const comps = Array.from(new Set(rows.map((m) => m.competition || "אחר")));
  const roundNo = (m: Match) => parseInt(m.round || "") || 0;
  const shown = rows
    .filter((m) => comp === "all" || (m.competition || "אחר") === comp)
    .sort((a, b) => (b.match_date || "").localeCompare(a.match_date || "") || roundNo(b) - roundNo(a));

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
      <div className="flex items-center justify-between"><div><h1 className="h1">תיקי משחקים</h1><p className="sub">תיק לכל משחק: פרי מאטצ', פוסט מאטצ', משחקים מלאים, אנימציות, קטעי וידאו, נייחים, רעיונות, וידאו אישי ודוחות.</p></div>
        <button className="btn-primary" onClick={() => setF({ opponent: "", home: true, competition: "ליגת העל" })}>+ משחק</button></div>
      {comps.length > 1 && <div className="seg mb-4">
        <button className={comp === "all" ? "on" : ""} onClick={() => setComp("all")}>הכל <span className="num">{rows.length}</span></button>
        {comps.map((c) => <button key={c} className={comp === c ? "on" : ""} onClick={() => setComp(c)}>{c} <span className="num">{rows.filter((m) => (m.competition || "אחר") === c).length}</span></button>)}
      </div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`} className="card flex items-center gap-3 hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded bg-ink text-white">
              <span className="text-[9px] uppercase tracking-wider text-gray-400">מחזור</span>
              <span className="font-display text-xl font-bold leading-none">{m.round || "–"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{m.home ? "בית" : "חוץ"} מול {m.opponent}</div>
              <div className="text-xs text-gray-500">{m.competition}{m.match_date ? ` · ${fmtDate(m.match_date)}` : ""}</div>
              <div className="mt-0.5 text-xs text-gray-400">📁 <span className="num">{counts[m.id] || 0}</span> קבצים</div>
            </div>
            {m.goals_for != null && <div className="font-display text-2xl font-bold" dir="ltr">{m.goals_for}-{m.goals_against}</div>}
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
