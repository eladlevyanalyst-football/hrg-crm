"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import TaskBoard from "@/components/TaskBoard";
import FileFolder from "@/components/FileFolder";
import { useSupabase } from "@/lib/useData";
import { FILE_CATEGORIES, fmtDate } from "@/lib/labels";
import type { DataImport, Match } from "@/lib/types";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sb = useSupabase();
  const [m, setM] = useState<Match | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [imports, setImports] = useState<DataImport[]>([]);
  const [editM, setEditM] = useState(false);

  useEffect(() => {
    sb.from("matches").select("*").eq("id", id).single().then(({ data }) => setM(data));
    sb.from("data_imports").select("id,title,source,data_date").eq("match_id", id).then(({ data }) => setImports((data as DataImport[]) || []));
  }, [id, sb]);

  async function saveMatch(e: React.FormEvent) {
    e.preventDefault(); if (!m) return;
    const { id: _id, ...rest } = m; void _id;
    await sb.from("matches").update(rest).eq("id", id); setEditM(false);
  }
  async function delMatch() {
    if (!confirm("למחוק את כל תיק המשחק?")) return;
    await sb.from("matches").delete().eq("id", id); router.push("/matches");
  }

  if (!m) return <p>טוען...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/matches" className="text-xs font-semibold text-gray-500">→ תיקי משחקים</Link>
          <h1 className="h1 mt-1">{m.home ? `הפועל ר״ג – ${m.opponent}` : `${m.opponent} – הפועל ר״ג`}</h1>
        </div>
        <div className="flex gap-2"><button className="btn-ghost" onClick={() => setEditM(true)}>עריכה</button><button className="btn-danger" onClick={delMatch}>מחיקה</button></div>
      </div>
      <div className="strip">
        <div><span className="strip-label">מחזור</span><span className="strip-value">{m.round || "–"}</span></div>
        <div><span className="strip-label">תאריך</span><span className="strip-value">{fmtDate(m.match_date) || "–"}</span></div>
        <div><span className="strip-label">מגרש</span><span className="strip-value">{m.home ? "בית" : "חוץ"}</span></div>
        <div><span className="strip-label">מסגרת</span><span className="strip-value">{m.competition || "–"}</span></div>
        {m.goals_for != null && <div><span className="strip-label">תוצאה</span><span className="strip-value text-2xl" dir="ltr">{m.goals_for} - {m.goals_against}</span></div>}
        <div><span className="strip-label">קבצים</span><span className="strip-value">{fileCount}</span></div>
      </div>

      <FileFolder matchId={id} categories={FILE_CATEGORIES} onCount={setFileCount}
        extra={{ key: "tasks", label: "משימות למשחק", node: <TaskBoard matchId={id} /> }} />

      {imports.length > 0 && <div className="card"><h2 className="h2">נתונים מקושרים למשחק</h2>
        <ul className="text-sm">{imports.map((i) => <li key={i.id}><Link className="text-[var(--brand)] hover:underline" href={`/data/${i.id}`}>{i.title}</Link></li>)}</ul></div>}

      <Modal open={editM} onClose={() => setEditM(false)} title="עריכת משחק">
        <form onSubmit={saveMatch} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">יריבה</label><input className="input" value={m.opponent} onChange={(e) => setM({ ...m, opponent: e.target.value })} /></div>
          <div><label className="label">מחזור</label><input className="input" value={m.round || ""} onChange={(e) => setM({ ...m, round: e.target.value })} /></div>
          <div><label className="label">תאריך</label><input className="input" type="date" value={m.match_date || ""} onChange={(e) => setM({ ...m, match_date: e.target.value })} /></div>
          <div><label className="label">שערי זכות</label><input className="input" type="number" value={m.goals_for ?? ""} onChange={(e) => setM({ ...m, goals_for: e.target.value === "" ? null : +e.target.value })} /></div>
          <div><label className="label">שערי חובה</label><input className="input" type="number" value={m.goals_against ?? ""} onChange={(e) => setM({ ...m, goals_against: e.target.value === "" ? null : +e.target.value })} /></div>
          <div className="col-span-2"><label className="label">הערות</label><textarea className="input" rows={3} value={m.notes || ""} onChange={(e) => setM({ ...m, notes: e.target.value })} /></div>
          <button className="btn-primary col-span-2">שמירה</button>
        </form>
      </Modal>
    </div>
  );
}
