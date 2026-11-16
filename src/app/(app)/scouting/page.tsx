"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useMe, useStaff, useTable } from "@/lib/useData";
import { POSITIONS, SCOUT_STATUS, fmtDate, todayISO } from "@/lib/labels";
import { openFile, uploadFile } from "@/lib/files";
import type { ScoutList, ScoutPlayer, ScoutReport } from "@/lib/types";

export default function Scouting() {
  const { rows: lists, reload: reloadLists, sb } = useTable<ScoutList>("scouting_lists", "name", true);
  const { rows: players, reload } = useTable<ScoutPlayer>("scouting_players", "created_at", false);
  const { rows: staff } = useStaff();
  const me = useMe();
  const [list, setList] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<ScoutPlayer> | null>(null);
  const [view, setView] = useState<ScoutPlayer | null>(null);
  const [reports, setReports] = useState<ScoutReport[]>([]);
  const [rep, setRep] = useState<Partial<ScoutReport>>({});
  const [repFile, setRepFile] = useState<File | null>(null);

  const shown = players.filter((p) => (!list || p.list_id === list) && (!status || p.status === status) && (!q || `${p.full_name} ${p.club} ${p.position}`.includes(q)));

  async function addList() {
    const name = prompt("שם הרשימה (למשל: חלוצים לינואר)");
    if (name) { await sb.from("scouting_lists").insert({ name }); reloadLists(); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!edit) return;
    const { id, ...rest } = edit;
    if (id) await sb.from("scouting_players").update(rest).eq("id", id); else await sb.from("scouting_players").insert(rest);
    setEdit(null); reload();
  }
  async function del() {
    if (edit?.id && confirm("למחוק?")) { await sb.from("scouting_players").delete().eq("id", edit.id); setEdit(null); reload(); }
  }
  async function loadReports(p: ScoutPlayer) {
    const { data } = await sb.from("scouting_reports").select("*").eq("scouting_player_id", p.id).order("report_date", { ascending: false });
    setReports(data || []);
  }
  useEffect(() => { if (view) { loadReports(view); setRep({ report_date: todayISO() }); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  async function addReport(e: React.FormEvent) {
    e.preventDefault(); if (!view) return;
    let storage_path = null;
    if (repFile) storage_path = await uploadFile(sb, repFile, `scouting/${view.id}`);
    await sb.from("scouting_reports").insert({ ...rep, storage_path, scouting_player_id: view.id, author_id: me?.id });
    setRep({ report_date: todayISO() }); setRepFile(null); loadReports(view);
  }
  const author = (id: string | null) => staff.find((s) => s.id === id)?.full_name || "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="h1">פינת סקאוטינג</h1>
        <div className="flex gap-2"><button className="btn-ghost" onClick={addList}>+ רשימה</button>
          <button className="btn-primary" onClick={() => setEdit({ full_name: "", status: "watching", list_id: list || null })}>+ שחקן במעקב</button></div></div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={() => setList("")} className={`chip px-3 py-1 ${!list ? "bg-[var(--brand)] text-white" : "bg-white border"}`}>הכל ({players.length})</button>
        {lists.map((l) => <button key={l.id} onClick={() => setList(l.id)} className={`chip px-3 py-1 ${list === l.id ? "bg-[var(--brand)] text-white" : "bg-white border"}`}>{l.name} ({players.filter((p) => p.list_id === l.id).length})</button>)}
      </div>
      <div className="mb-3 flex gap-2">
        <input className="input w-56" placeholder="חיפוש שם, קבוצה, עמדה" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-36" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">כל הסטטוסים</option>{Object.entries(SCOUT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl"><thead><tr><th>שם</th><th>קבוצה</th><th>עמדה</th><th>שנתון</th><th>אזרחות</th><th>ציון</th><th>סטטוס</th><th>רשימה</th><th></th></tr></thead>
          <tbody>{shown.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td><button className="font-medium text-[var(--brand)] hover:underline" onClick={() => setView(p)}>{p.full_name}</button></td>
              <td>{p.club}</td><td>{p.position}</td><td>{p.birth_year}</td><td>{p.nationality}</td>
              <td>{p.rating ? <b>{p.rating}/10</b> : ""}</td>
              <td><span className={`chip ${SCOUT_STATUS[p.status]?.color}`}>{SCOUT_STATUS[p.status]?.label}</span></td>
              <td className="text-gray-500">{lists.find((l) => l.id === p.list_id)?.name}</td>
              <td><button className="text-xs text-gray-500 hover:underline" onClick={() => setEdit(p)}>עריכה</button></td>
            </tr>))}</tbody></table>
        {shown.length === 0 && <p className="p-4 text-sm text-gray-500">אין שחקנים ברשימה.</p>}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "עריכת שחקן" : "שחקן חדש במעקב"} wide>
        {edit && <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">שם</label><input className="input" required value={edit.full_name || ""} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} /></div>
          <div><label className="label">קבוצה</label><input className="input" value={edit.club || ""} onChange={(e) => setEdit({ ...edit, club: e.target.value })} /></div>
          <div><label className="label">עמדה</label><select className="input" value={edit.position || ""} onChange={(e) => setEdit({ ...edit, position: e.target.value })}><option value="">-</option>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="label">שנתון</label><input className="input" type="number" value={edit.birth_year ?? ""} onChange={(e) => setEdit({ ...edit, birth_year: e.target.value ? +e.target.value : null })} /></div>
          <div><label className="label">אזרחות</label><input className="input" value={edit.nationality || ""} onChange={(e) => setEdit({ ...edit, nationality: e.target.value })} /></div>
          <div><label className="label">רגל</label><input className="input" value={edit.foot || ""} onChange={(e) => setEdit({ ...edit, foot: e.target.value })} /></div>
          <div><label className="label">סוכן</label><input className="input" value={edit.agent || ""} onChange={(e) => setEdit({ ...edit, agent: e.target.value })} /></div>
          <div><label className="label">ציון (1 עד 10)</label><input className="input" type="number" min={1} max={10} value={edit.rating ?? ""} onChange={(e) => setEdit({ ...edit, rating: e.target.value ? +e.target.value : null })} /></div>
          <div><label className="label">סטטוס</label><select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{Object.entries(SCOUT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="label">רשימה</label><select className="input" value={edit.list_id || ""} onChange={(e) => setEdit({ ...edit, list_id: e.target.value || null })}><option value="">-</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          <div><label className="label">קישור לווידאו / Wyscout</label><input className="input" dir="ltr" value={edit.video_url || ""} onChange={(e) => setEdit({ ...edit, video_url: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">הערות</label><textarea className="input" rows={3} value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
          <div className="col-span-2 flex gap-2"><button className="btn-primary flex-1">שמירה</button>{edit.id && <button type="button" className="btn-danger" onClick={del}>מחיקה</button>}</div>
        </form>}
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={view ? `${view.full_name} · ${view.club || ""}` : ""} wide>
        {view && <div className="space-y-4">
          <div className="text-sm text-gray-600">{[view.position, view.birth_year && `שנתון ${view.birth_year}`, view.nationality, view.foot, view.agent && `סוכן: ${view.agent}`].filter(Boolean).join(" · ")}
            {view.video_url && <> · <a className="text-[var(--brand)] underline" href={view.video_url} target="_blank">וידאו</a></>}</div>
          {view.notes && <p className="whitespace-pre-wrap text-sm">{view.notes}</p>}
          <div>
            <h3 className="h2">דוחות ({reports.length})</h3>
            <div className="space-y-2">{reports.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <div className="mb-1 flex flex-wrap gap-2 text-xs text-gray-500"><b className="text-gray-800">{author(r.author_id)}</b><span>{fmtDate(r.report_date)}</span>{r.match_watched && <span>· {r.match_watched}</span>}{r.rating && <span className="chip bg-gray-100">{r.rating}/10</span>}</div>
                <p className="whitespace-pre-wrap">{r.body}</p>
                {r.storage_path && <button className="mt-1 text-xs text-[var(--brand)] underline" onClick={() => openFile(sb, r)}>📎 קובץ מצורף</button>}
              </div>))}</div>
          </div>
          <form onSubmit={addReport} className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="font-medium">דוח חדש</div>
            <div className="grid grid-cols-3 gap-2">
              <input className="input col-span-2" placeholder="משחק שנצפה" value={rep.match_watched || ""} onChange={(e) => setRep({ ...rep, match_watched: e.target.value })} />
              <input className="input" type="number" min={1} max={10} placeholder="ציון" value={rep.rating ?? ""} onChange={(e) => setRep({ ...rep, rating: e.target.value ? +e.target.value : null })} />
            </div>
            <textarea className="input" rows={4} placeholder="התרשמות: יכולות, חולשות, התאמה לקבוצה..." required value={rep.body || ""} onChange={(e) => setRep({ ...rep, body: e.target.value })} />
            <input type="file" className="input" onChange={(e) => setRepFile(e.target.files?.[0] || null)} />
            <button className="btn-primary">שמירת דוח</button>
          </form>
        </div>}
      </Modal>
    </div>
  );
}
