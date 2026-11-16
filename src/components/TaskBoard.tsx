"use client";
import { useState } from "react";
import Modal from "@/components/Modal";
import { useMe, useStaff, useTable } from "@/lib/useData";
import { PRIORITY, TASK_STATUS, fmtDate } from "@/lib/labels";
import type { Task } from "@/lib/types";

/** Kanban task board. If matchId is given, shows only that match's tasks. */
export default function TaskBoard({ matchId }: { matchId?: string }) {
  const { rows, reload, sb } = useTable<Task>("tasks", "due_date", true, matchId ? (q) => q.eq("match_id", matchId) : undefined);
  const { rows: staff } = useStaff();
  const me = useMe();
  const [edit, setEdit] = useState<Partial<Task> | null>(null);
  const [who, setWho] = useState("");
  const name = (id: string | null) => staff.find((s) => s.id === id)?.full_name || "לא משויך";
  const list = rows.filter((t) => !who || (who === "me" ? t.assignee_id === me?.id : t.assignee_id === who));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const { id, ...rest } = edit;
    if (id) await sb.from("tasks").update(rest).eq("id", id);
    else await sb.from("tasks").insert({ ...rest, created_by: me?.id, match_id: matchId || null });
    setEdit(null); reload();
  }
  async function moveTo(id: string, status: string) {
    await sb.from("tasks").update({ status }).eq("id", id); reload();
  }
  async function del() {
    if (edit?.id && confirm("למחוק משימה?")) { await sb.from("tasks").delete().eq("id", edit.id); setEdit(null); reload(); }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select className="input w-44" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">כל הצוות</option><option value="me">המשימות שלי</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setEdit({ title: "", status: "todo", priority: "normal", assignee_id: me?.id || null })}>+ משימה</button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(TASK_STATUS).map(([st, label]) => (
          <div key={st} className="rounded-md bg-gray-100 p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => moveTo(e.dataTransfer.getData("id"), st)}>
            <div className="mb-2 px-1 text-sm font-semibold text-gray-600">{label} ({list.filter((t) => t.status === st).length})</div>
            <div className="min-h-20 space-y-2">
              {list.filter((t) => t.status === st).map((t) => (
                <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", t.id)} onClick={() => setEdit(t)}
                  className="cursor-pointer rounded-lg bg-white p-3 text-sm shadow-sm hover:shadow">
                  <div className="font-medium">{t.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
                    <span>{name(t.assignee_id)}</span>
                    {t.due_date && <span>· {fmtDate(t.due_date)}</span>}
                    {t.priority !== "normal" && <span className={`chip ${PRIORITY[t.priority]?.color}`}>{PRIORITY[t.priority]?.label}</span>}
                  </div>
                  <div className="mt-2 flex gap-1 md:hidden">{Object.keys(TASK_STATUS).filter((s) => s !== st).map((s) => (
                    <button key={s} className="chip bg-gray-100" onClick={(e) => { e.stopPropagation(); moveTo(t.id, s); }}>→ {TASK_STATUS[s]}</button>))}</div>
                </div>))}
            </div>
          </div>))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "עריכת משימה" : "משימה חדשה"}>
        {edit && <form onSubmit={save} className="space-y-3">
          <div><label className="label">משימה</label><input className="input" required value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
          <div><label className="label">פירוט</label><textarea className="input" rows={3} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">אחראי</label><select className="input" value={edit.assignee_id || ""} onChange={(e) => setEdit({ ...edit, assignee_id: e.target.value || null })}><option value="">-</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></div>
            <div><label className="label">תאריך יעד</label><input className="input" type="date" value={edit.due_date || ""} onChange={(e) => setEdit({ ...edit, due_date: e.target.value || null })} /></div>
            <div><label className="label">עדיפות</label><select className="input" value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className="label">סטטוס</label><select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          </div>
          <div className="flex gap-2"><button className="btn-primary flex-1">שמירה</button>{edit.id && <button type="button" className="btn-danger" onClick={del}>מחיקה</button>}</div>
        </form>}
      </Modal>
    </div>
  );
}
