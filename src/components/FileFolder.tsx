"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useMe, usePlayers, useSupabase } from "@/lib/useData";
import { fmtDate } from "@/lib/labels";
import { openFile, uploadFile } from "@/lib/files";
import type { MatchFile } from "@/lib/types";

type Extra = { key: string; label: string; node: React.ReactNode };

function kindIcon(f: MatchFile) {
  if (f.external_url) return "🔗";
  const ext = (f.storage_path || "").split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "m4v", "webm"].includes(ext)) return "🎬";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "🖼️";
  return "📄";
}

/**
 * Tabbed file folder. matchId = a match's id, or null for the video library.
 * Every category is a tab; staff can upload files or add links into the open tab.
 */
export default function FileFolder({ matchId, categories, extra, onCount }: {
  matchId: string | null;
  categories: Record<string, string>;
  extra?: Extra;
  onCount?: (n: number) => void;
}) {
  const sb = useSupabase();
  const me = useMe();
  const { rows: players } = usePlayers();
  const [files, setFiles] = useState<MatchFile[]>([]);
  const [tab, setTab] = useState(Object.keys(categories)[0]);
  const [add, setAdd] = useState(false);
  const [up, setUp] = useState({ title: "", link: "", player_id: "" });
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    let query = sb.from("match_files").select("*");
    query = matchId ? query.eq("match_id", matchId) : query.is("match_id", null);
    const { data } = await query.order("title");
    setFiles(data || []);
    onCount?.((data || []).length);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [matchId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const base = { match_id: matchId, category: tab, player_id: up.player_id || null, uploaded_by: me?.id };
    const folder = matchId ? `matches/${matchId}/${tab}` : `library/${tab}`;
    try {
      if (fileList && fileList.length) {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          setBusy(`מעלה ${i + 1}/${fileList.length}: ${file.name}`);
          const path = await uploadFile(sb, file, folder);
          const title = fileList.length === 1 && up.title ? up.title : file.name.replace(/\.[^.]+$/, "");
          await sb.from("match_files").insert({ ...base, title, storage_path: path });
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
    // Only remove the stored object if no other row points at it (library copies are shared)
    if (f.storage_path) {
      const { count } = await sb.from("match_files").select("id", { count: "exact", head: true }).eq("storage_path", f.storage_path);
      if ((count || 0) < 2) await sb.storage.from("files").remove([f.storage_path]);
    }
    await sb.from("match_files").delete().eq("id", f.id); load();
  }

  const pname = (pid: string | null) => players.find((p) => p.id === pid)?.full_name;
  const inTab = files.filter((f) => f.category === tab && (!q || f.title.toLowerCase().includes(q.toLowerCase())));
  const tabBtn = (active: boolean, accent = false) =>
    `rounded border px-3 py-1.5 text-sm font-semibold ${active ? (accent ? "border-brand bg-brand text-white" : "border-ink bg-ink text-white") : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(categories).map(([k, v]) => {
          const n = files.filter((f) => f.category === k).length;
          return (
            <button key={k} onClick={() => setTab(k)} className={tabBtn(tab === k)}>
              {v} <span className={`num text-xs ${tab === k ? "text-gray-300" : n ? "text-brand" : "text-gray-400"}`}>{n}</span>
            </button>);
        })}
        {extra && <button onClick={() => setTab(extra.key)} className={tabBtn(tab === extra.key, true)}>{extra.label}</button>}
      </div>

      {extra && tab === extra.key ? extra.node : (
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="h2 mb-0">{categories[tab]}</h2>
            <div className="flex items-center gap-2">
              <input className="input w-44 py-1.5" placeholder="חיפוש בתיקייה" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn-primary" onClick={() => setAdd(true)}>+ העלאה / קישור</button>
            </div>
          </div>
          {inTab.length === 0 && <p className="text-sm text-gray-500">{q ? "לא נמצאו קבצים." : "התיקייה ריקה."}</p>}
          <ul className="divide-y">{inTab.map((f) => (
            <li key={f.id} className="flex items-center gap-2 py-2 text-sm">
              <span>{kindIcon(f)}</span>
              <button className="text-right font-medium text-[var(--brand)] hover:underline" onClick={() => openFile(sb, f)}>{f.title}</button>
              {f.player_id && <span className="chip bg-gray-100">{pname(f.player_id)}</span>}
              <span className="text-gray-400">{fmtDate(f.created_at)}</span>
              <button className="btn-danger mr-auto py-1" onClick={() => delFile(f)}>מחיקה</button>
            </li>))}</ul>
        </div>)}

      <Modal open={add} onClose={() => setAdd(false)} title={`הוספה ל${categories[tab] || ""}`}>
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
    </>
  );
}
