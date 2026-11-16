"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import TaskBoard from "@/components/TaskBoard";
import { useMe, usePlayers, useSupabase } from "@/lib/useData";
import { FILE_CATEGORIES, fmtDate } from "@/lib/labels";
import { openFile, uploadFile } from "@/lib/files";
import type { DataImport, Match, MatchFile } from "@/lib/types";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sb = useSupabase();
  const me = useMe();
  const { rows: players } = usePlayers();
  const [m, setM] = useState<Match | null>(null);
  const [files, setFiles] = useState<MatchFile[]>([]);
  const [imports, setImports] = useState<DataImport[]>([]);
  const [tab, setTab] = useState("pre");
  const [add, setAdd] = useState(false);
  const [editM, setEditM] = useState(false);
  const [up, setUp] = useState({ title: "", link: "", player_id: "" });
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(""); 

  async function load() {
    sb.from("matches").select("*").eq("id", id).single().then(({ data }) => setM(data));
    sb.from("match_files").select("*").eq("match_id", id).order("created_at", { ascending: false }).then(({ data }) => setFiles(data || []));
    sb.from("data_imports").select("id,title,source,data_date").eq("match_id", id).then(({ data }) => setImports((data as DataImport[]) || []));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const base = { match_id: id, category: tab, player_id: up.player_id || null, uploaded_by: me?.id };
    try {
      if (fileList && fileList.length) {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          setBusy(`מעלה ${i + 1}/${fileList.length}: ${file.name}`);
          const path = await uploadFile(sb, file, `matches/${id}/${tab}`);
          await sb.from("match_files").insert({ ...base, title: fileList.length === 1 && up.title ? up.title : file.name, storage_path: path });
        }
      } else if (up.link) {
        await sb.from("match_files").insert({ ...base, title: up.title || up.link, external_url: up.link });
      }
    } catch (err) {
      alert("ההעלאה נכשלה: " + (err as Error).message + "\nקבצים גדולים מאוד (משחק מלא) עדיף להוסיף כקישור.");
    }
    setBusy(""); setAdd(false); setUp({ title: "", link: "", player_id: "" }); setFileList(null); load();
  }
  async function delFile(f: MatchFile) {
    if (!confirm(`למחוק את "${f.title}"?`)) return;
    if (f.storage_path) await sb.storage.from("files").remove([f.storage_path]);
    await sb.from("match_files").delete().eq("id", f.id); load();
  }
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
  const pname = (pid: string | null) => players.find((p) => p.id === pid)?.full_name;
  const inTab = files.filter((f) => f.category === tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/matches" className="text-sm text-gray-500">→ תיקי משחקים</Link>
        <h1 className="text-2xl font-bold">{m.home ? "בית" : "חוץ"} מול {m.opponent}</h1>
        {m.goals_for != null && <span className="text-xl font-bold" dir="ltr">{m.goals_for}-{m.goals_against}</span>}
        <span className="text-sm text-gray-500">מחזור {m.round || "-"} · {fmtDate(m.match_date)}</span>
        <div className="mr-auto flex gap-2"><button className="btn-ghost" onClick={() => setEditM(true)}>עריכה</button><button className="btn-danger" onClick={delMatch}>מחיקה</button></div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {Object.entries(FILE_CATEGORIES).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-[var(--brand)] font-semibold text-[var(--brand)]" : "border-transparent text-gray-600"}`}>
            {v} <span className="text-xs text-gray-400">({files.filter((f) => f.category === k).length})</span></button>))}
        <button onClick={() => setTab("tasks")} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === "tasks" ? "border-[var(--brand)] font-semibold text-[var(--brand)]" : "border-transparent text-gray-600"}`}>משימות</button>
      </div>

      {tab === "tasks" ? <TaskBoard matchId={id} /> : (
        <div className="card">
          <div className="mb-3 flex items-center justify-between"><h2 className="h2 mb-0">{FILE_CATEGORIES[tab]}</h2><button className="btn-primary" onClick={() => setAdd(true)}>+ העלאה / קישור</button></div>
          {inTab.length === 0 && <p className="text-sm text-gray-500">התיקייה ריקה.</p>}
          <ul className="divide-y">{inTab.map((f) => (
            <li key={f.id} className="flex items-center gap-2 py-2 text-sm">
              <span>{f.external_url ? "🔗" : "📄"}</span>
              <button className="font-medium text-[var(--brand)] hover:underline" onClick={() => openFile(sb, f)}>{f.title}</button>
              {f.player_id && <span className="chip bg-gray-100">{pname(f.player_id)}</span>}
              <span className="text-gray-400">{fmtDate(f.created_at)}</span>
              <button className="btn-danger mr-auto py-1" onClick={() => delFile(f)}>מחיקה</button>
            </li>))}</ul>
        </div>)}

      {imports.length > 0 && <div className="card"><h2 className="h2">נתונים מקושרים למשחק</h2>
        <ul className="text-sm">{imports.map((i) => <li key={i.id}><Link className="text-[var(--brand)] hover:underline" href={`/data/${i.id}`}>{i.title}</Link></li>)}</ul></div>}

      <Modal open={add} onClose={() => setAdd(false)} title={`הוספה ל${FILE_CATEGORIES[tab] || ""}`}>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">קבצים מהמחשב (אפשר כמה)</label><input type="file" multiple className="input" onChange={(e) => setFileList(e.target.files)} /></div>
          <div className="text-center text-xs text-gray-400">או</div>
          <div><label className="label">קישור (Drive, Wyscout, YouTube...)</label><input className="input" dir="ltr" type="url" value={up.link} onChange={(e) => setUp({ ...up, link: e.target.value })} /></div>
          <div><label className="label">כותרת (לא חובה)</label><input className="input" value={up.title} onChange={(e) => setUp({ ...up, title: e.target.value })} /></div>
          <div><label className="label">שחקן (לווידאו אישי)</label><select className="input" value={up.player_id} onChange={(e) => setUp({ ...up, player_id: e.target.value })}><option value="">-</option>{players.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
          {busy && <p className="text-sm text-gray-600">{busy}</p>}
          <button className="btn-primary w-full" disabled={!!busy || (!fileList?.length && !up.link)}>הוספה</button>
        </form>
      </Modal>
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
