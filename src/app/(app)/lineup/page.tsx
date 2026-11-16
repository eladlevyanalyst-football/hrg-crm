"use client";
import { useState } from "react";
import { usePlayers, useMe, useTable } from "@/lib/useData";
import type { Lineup, Match, Slot } from "@/lib/types";
import { fmtDate } from "@/lib/labels";

// x: 0 (left) .. 100 (right), y: 0 (attack) .. 100 (own goal)
const F: Record<string, [string, number, number][]> = {
  "4-3-3": [["GK", 50, 92], ["RB", 85, 72], ["CB", 62, 76], ["CB", 38, 76], ["LB", 15, 72], ["CM", 70, 52], ["DM", 50, 58], ["CM", 30, 52], ["RW", 82, 25], ["ST", 50, 18], ["LW", 18, 25]],
  "4-4-2": [["GK", 50, 92], ["RB", 85, 72], ["CB", 62, 76], ["CB", 38, 76], ["LB", 15, 72], ["RM", 85, 48], ["CM", 60, 52], ["CM", 40, 52], ["LM", 15, 48], ["ST", 60, 20], ["ST", 40, 20]],
  "4-2-3-1": [["GK", 50, 92], ["RB", 85, 72], ["CB", 62, 76], ["CB", 38, 76], ["LB", 15, 72], ["DM", 62, 58], ["DM", 38, 58], ["RW", 82, 34], ["AM", 50, 36], ["LW", 18, 34], ["ST", 50, 16]],
  "3-5-2": [["GK", 50, 92], ["CB", 72, 76], ["CB", 50, 78], ["CB", 28, 76], ["RWB", 88, 50], ["CM", 68, 54], ["DM", 50, 60], ["CM", 32, 54], ["LWB", 12, 50], ["ST", 60, 20], ["ST", 40, 20]],
  "3-4-3": [["GK", 50, 92], ["CB", 72, 76], ["CB", 50, 78], ["CB", 28, 76], ["RM", 86, 52], ["CM", 60, 56], ["CM", 40, 56], ["LM", 14, 52], ["RW", 78, 24], ["ST", 50, 18], ["LW", 22, 24]],
  "5-3-2": [["GK", 50, 92], ["RWB", 88, 66], ["CB", 70, 76], ["CB", 50, 78], ["CB", 30, 76], ["LWB", 12, 66], ["CM", 70, 50], ["CM", 50, 54], ["CM", 30, 50], ["ST", 60, 20], ["ST", 40, 20]],
};
const build = (f: string): Slot[] => F[f].map(([label, x, y]) => ({ label, x, y, player_id: null }));

export default function LineupPage() {
  const { rows: all } = usePlayers();
  const players = all.filter((p) => p.active);
  const { rows: saved, reload, sb } = useTable<Lineup>("lineups", "created_at", false);
  const { rows: matches } = useTable<Match>("matches", "match_date", false);
  const me = useMe();
  const [cur, setCur] = useState<Lineup>({ id: "", name: "הרכב חדש", formation: "4-3-3", slots: build("4-3-3"), bench: [], match_id: null });
  const [pick, setPick] = useState<number | null>(null);

  const used = new Set([...cur.slots.map((s) => s.player_id), ...cur.bench].filter(Boolean) as string[]);
  const pl = (id: string | null) => players.find((p) => p.id === id) || all.find((p) => p.id === id);

  function setFormation(f: string) {
    const ns = build(f);
    cur.slots.forEach((s, i) => { if (ns[i]) ns[i].player_id = s.player_id; });
    setCur({ ...cur, formation: f, slots: ns });
  }
  function place(i: number, pid: string | null) {
    const slots = cur.slots.map((s) => (s.player_id === pid && pid ? { ...s, player_id: null } : s));
    slots[i] = { ...slots[i], player_id: pid };
    setCur({ ...cur, slots, bench: cur.bench.filter((b) => b !== pid) });
    setPick(null);
  }
  function toBench(pid: string) {
    setCur({ ...cur, slots: cur.slots.map((s) => (s.player_id === pid ? { ...s, player_id: null } : s)), bench: cur.bench.includes(pid) ? cur.bench : [...cur.bench, pid] });
  }
  async function save() {
    const { id, ...rest } = cur;
    if (id) await sb.from("lineups").update(rest).eq("id", id);
    else { const { data } = await sb.from("lineups").insert({ ...rest, created_by: me?.id }).select().single(); if (data) setCur(data); }
    reload();
  }
  async function del() {
    if (cur.id && confirm("למחוק את ההרכב?")) { await sb.from("lineups").delete().eq("id", cur.id); setCur({ id: "", name: "הרכב חדש", formation: "4-3-3", slots: build("4-3-3"), bench: [], match_id: null }); reload(); }
  }

  return (
    <div>
      <h1 className="h1">מגרש הרכבים</h1><p className="sub">בונים הרכב וסגל: בוחרים מערך, לוחצים על עמדה ואז על שחקן, או גוררים.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className="input w-52" value={cur.id} onChange={(e) => { const l = saved.find((s) => s.id === e.target.value); setCur(l || { id: "", name: "הרכב חדש", formation: "4-3-3", slots: build("4-3-3"), bench: [], match_id: null }); }}>
          <option value="">+ הרכב חדש</option>{saved.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="input w-48" value={cur.name} onChange={(e) => setCur({ ...cur, name: e.target.value })} />
        <select className="input w-28" dir="ltr" value={cur.formation} onChange={(e) => setFormation(e.target.value)}>{Object.keys(F).map((f) => <option key={f}>{f}</option>)}</select>
        <select className="input w-48" value={cur.match_id || ""} onChange={(e) => setCur({ ...cur, match_id: e.target.value || null })}><option value="">ללא משחק</option>{matches.map((m) => <option key={m.id} value={m.id}>{m.opponent} ({fmtDate(m.match_date)})</option>)}</select>
        <button className="btn-primary" onClick={save}>שמירה</button>
        {cur.id && <button className="btn-danger" onClick={del}>מחיקה</button>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="mx-auto w-full max-w-md">
          <div className="relative aspect-[68/100] w-full overflow-hidden rounded-md border-4 border-white shadow" dir="ltr"
            style={{ background: "repeating-linear-gradient(0deg,#2f8f3a 0 10%,#36a043 10% 20%)" }}>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/70" />
            <div className="absolute left-1/2 top-1/2 h-[18%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
            <div className="absolute left-1/2 top-0 h-[16%] w-[58%] -translate-x-1/2 border-2 border-t-0 border-white/70" />
            <div className="absolute bottom-0 left-1/2 h-[16%] w-[58%] -translate-x-1/2 border-2 border-b-0 border-white/70" />
            {cur.slots.map((s, i) => {
              const p = pl(s.player_id);
              return (
                <button key={i} onClick={() => setPick(i)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => place(i, e.dataTransfer.getData("pid"))}
                  className="absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow ${p ? "border-white bg-[var(--brand)] text-white" : "border-dashed border-white bg-white/20 text-white"} ${pick === i ? "ring-4 ring-yellow-300" : ""}`}>
                    {p ? p.shirt_number ?? "•" : s.label}
                  </span>
                  <span className="mt-0.5 max-w-20 truncate rounded bg-black/50 px-1 text-[11px] text-white" dir="rtl">{p ? p.full_name.split(" ").slice(-1)[0] : s.label}</span>
                </button>);
            })}
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">לחצו על עמדה ואז על שחקן מהרשימה, או גררו שחקן לעמדה.</p>
        </div>

        <div className="space-y-3">
          <div className="card">
            <h2 className="h2">ספסל ({cur.bench.length})</h2>
            <div className="flex flex-wrap gap-1">{cur.bench.map((b) => <button key={b} className="chip bg-gray-100" onClick={() => setCur({ ...cur, bench: cur.bench.filter((x) => x !== b) })}>{pl(b)?.full_name} ✕</button>)}</div>
          </div>
          <div className="card">
            <h2 className="h2">סגל {pick != null && <span className="text-sm font-normal text-[var(--brand)]">· בחר שחקן ל-{cur.slots[pick].label}</span>}</h2>
            <ul className="max-h-[50vh] space-y-1 overflow-y-auto">{players.map((p) => (
              <li key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData("pid", p.id)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${used.has(p.id) ? "text-gray-400" : "hover:bg-gray-50"}`}>
                <button className="flex flex-1 items-center gap-2 text-right" onClick={() => pick != null && place(pick, p.id)}>
                  <span className="w-6 font-bold text-[var(--brand)]">{p.shirt_number}</span>{p.full_name}<span className="text-xs text-gray-400">{p.position}</span>
                </button>
                <button className="text-xs text-gray-400 hover:text-gray-700" onClick={() => toBench(p.id)} title="לספסל">ספסל</button>
              </li>))}</ul>
            {pick != null && <button className="btn-ghost mt-2 w-full" onClick={() => place(pick, null)}>ניקוי העמדה</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
