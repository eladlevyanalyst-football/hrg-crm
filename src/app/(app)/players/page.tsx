"use client";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/Modal";
import PlayerForm from "@/components/PlayerForm";
import { usePlayers } from "@/lib/useData";
import { age } from "@/lib/labels";

export default function Players() {
  const { rows, reload } = usePlayers();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const list = rows.filter((p) => (showAll || p.active) && p.full_name.includes(q));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">שחקנים</h1>
        <div className="flex gap-2">
          <input className="input w-48" placeholder="חיפוש..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-primary" onClick={() => setOpen(true)}>+ שחקן</button>
        </div>
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> הצג גם שחקנים לא פעילים</label>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>#</th><th>שם</th><th>עמדה</th><th>גיל</th><th>רגל</th><th>טלפון</th><th>חוזה עד</th></tr></thead>
          <tbody>{list.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="font-bold text-[var(--brand)]">{p.shirt_number}</td>
              <td><Link href={`/players/${p.id}`} className="font-medium hover:underline">{p.full_name}</Link>{!p.active && <span className="chip mr-2 bg-gray-100 text-gray-500">לא פעיל</span>}</td>
              <td>{p.position}</td><td>{age(p.birth_date)}</td><td>{p.foot}</td>
              <td dir="ltr" className="text-right">{p.phone}</td><td>{p.contract_until}</td>
            </tr>))}</tbody>
        </table>
        {list.length === 0 && <p className="p-4 text-sm text-gray-500">אין שחקנים עדיין. לחץ "+ שחקן" כדי להוסיף.</p>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="שחקן חדש" wide>
        <PlayerForm onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </div>
  );
}
