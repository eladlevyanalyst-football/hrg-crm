"use client";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import PlayerForm from "@/components/PlayerForm";
import { usePlayers } from "@/lib/useData";
import { AVAILABILITY, POSITION_GROUPS, age } from "@/lib/labels";
import type { Player } from "@/lib/types";

export default function Players() {
  const { rows, setRows, reload, sb } = usePlayers();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const list = rows.filter((p) => (showAll || p.active) && p.full_name.includes(q));
  const known = new Set(POSITION_GROUPS.flatMap((g) => g.match));
  const groups = [...POSITION_GROUPS, { title: "ללא עמדה", match: [] as string[] }].map((g) => ({
    title: g.title,
    players: list.filter((p) => (g.match.length ? g.match.includes(p.position || "") : !known.has(p.position || ""))),
  })).filter((g) => g.players.length);

  async function setAvail(p: Player, availability: string) {
    setRows(rows.map((r) => (r.id === p.id ? { ...r, availability } : r)));
    await sb.from("players").update({ availability }).eq("id", p.id);
  }

  return (
    <div>
      <PageHeader title="שחקנים" sub="כרטיס לכל שחקן, מחולק לפי עמדות. לוחצים על זמין / פצוע כדי לעדכן מצב.">
        <span className="chip bg-white text-gray-500 border">{list.length} שחקנים</span>
        <input className="input w-44" placeholder="חיפוש..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary" onClick={() => setOpen(true)}>+ שחקן</button>
      </PageHeader>
      <label className="mb-2 flex items-center gap-2 text-xs text-gray-500"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> הצג גם שחקנים לא פעילים</label>

      {groups.map((g) => (
        <section key={g.title}>
          <div className="section-title">{g.title} <span className="text-gray-400">{g.players.length}</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7">
            {g.players.map((p) => {
              const av = p.availability || "available";
              return (
                <div key={p.id} className={`group overflow-hidden rounded-md border bg-white ${av === "injured" ? "border-brand" : "border-gray-200"}`}>
                  <Link href={`/players/${p.id}`} className="relative block aspect-[4/3] bg-gray-100">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" /> :
                      <div className="flex h-full items-center justify-center font-display text-5xl font-bold text-gray-300">{p.shirt_number ?? ""}</div>}
                    <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded bg-ink px-1 font-display text-sm font-bold text-white">{p.shirt_number ?? "-"}</span>
                    {!p.active && <span className="chip absolute left-2 top-2 bg-gray-200 text-gray-600">לא פעיל</span>}
                  </Link>
                  <div className="p-2">
                    <Link href={`/players/${p.id}`} className="block truncate text-sm font-bold hover:underline">{p.full_name}</Link>
                    <div className="truncate text-[11px] text-gray-500">{[p.position, age(p.birth_date) && `גיל ${age(p.birth_date)}`].filter(Boolean).join(" · ")}</div>
                    <div className="mt-2 flex gap-1">
                      {(["available", "injured"] as const).map((k) => (
                        <button key={k} onClick={() => setAvail(p, k)} className={`chip border ${av === k ? AVAILABILITY[k].color + " border-transparent" : "border-gray-200 bg-white text-gray-400"}`}>{AVAILABILITY[k].label}</button>))}
                    </div>
                  </div>
                </div>);
            })}
          </div>
        </section>))}
      {list.length === 0 && <p className="card text-sm text-gray-500">אין שחקנים עדיין. לחצו "+ שחקן" כדי להוסיף.</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="שחקן חדש" wide>
        <PlayerForm onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </div>
  );
}
