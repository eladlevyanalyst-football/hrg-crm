"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useSupabase } from "@/lib/useData";
import { EVENT_KINDS, fmtTime } from "@/lib/labels";
import type { EventRow } from "@/lib/types";

const DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const toLocalInput = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

export default function Calendar() {
  const sb = useSupabase();
  const [view, setView] = useState<"month" | "week">("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [edit, setEdit] = useState<Partial<EventRow> | null>(null);

  // visible range
  const start = new Date(cursor); start.setHours(0, 0, 0, 0);
  if (view === "month") { start.setDate(1); }
  start.setDate(start.getDate() - start.getDay()); // back to Sunday
  const days = view === "week" ? 7 : 42;
  const range = Array.from({ length: days }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const end = new Date(range[range.length - 1]); end.setDate(end.getDate() + 1);

  async function load() {
    const { data } = await sb.from("events").select("*").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at");
    setEvents(data || []);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [cursor, view]);

  function move(n: number) {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + 7 * n); else d.setMonth(d.getMonth() + n);
    setCursor(d);
  }
  function newEvent(day: Date) {
    const s = new Date(day); s.setHours(10, 0, 0, 0);
    const e = new Date(s); e.setHours(11, 30);
    setEdit({ title: "", kind: "training", starts_at: s.toISOString(), ends_at: e.toISOString() });
  }
  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!edit) return;
    const { id, ...rest } = edit;
    if (id) await sb.from("events").update(rest).eq("id", id); else await sb.from("events").insert(rest);
    setEdit(null); load();
  }
  async function del() {
    if (edit?.id && confirm("למחוק את האירוע?")) { await sb.from("events").delete().eq("id", edit.id); setEdit(null); load(); }
  }
  const dayEvents = (d: Date) => events.filter((e) => ymd(new Date(e.starts_at)) === ymd(d));
  const today = ymd(new Date());
  const title = view === "month" ? cursor.toLocaleDateString("he-IL", { month: "long", year: "numeric" })
    : `${range[0].toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })} – ${range[6].toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" })}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div><h1 className="h1">לוח שנה</h1><p className="sub mb-0">לו״ז שבועי וחודשי: אימונים, משחקים, פגישות וימי חופש.</p></div>
        <div className="mr-auto flex items-center gap-2">
          <button className="btn-ghost" onClick={() => move(-1)}>→</button>
          <span className="min-w-36 text-center font-medium">{title}</span>
          <button className="btn-ghost" onClick={() => move(1)}>←</button>
          <button className="btn-ghost" onClick={() => setCursor(new Date())}>היום</button>
          <div className="seg"><button className={view === "week" ? "on" : ""} onClick={() => setView("week")}>שבועי</button><button className={view === "month" ? "on" : ""} onClick={() => setView("month")}>חודשי</button></div>
          <button className="btn-primary" onClick={() => newEvent(new Date())}>+ אירוע</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-gray-200">
        {DAYS.map((d) => <div key={d} className="bg-ink py-2 text-center text-xs font-bold text-white">{d}</div>)}
        {range.map((d) => {
          const out = view === "month" && d.getMonth() !== cursor.getMonth();
          return (
            <div key={d.toISOString()} onDoubleClick={() => newEvent(d)}
              className={`bg-white p-1 ${view === "week" ? "min-h-[60vh]" : "min-h-24"} ${out ? "opacity-40" : ""}`}>
              <div className={`mb-1 text-xs ${ymd(d) === today ? "inline-block rounded bg-brand px-1.5 font-bold text-white" : "text-gray-500"}`}>{d.getDate()}</div>
              <div className="space-y-1">{dayEvents(d).map((e) => (
                <button key={e.id} onClick={() => setEdit(e)} className={`block w-full truncate rounded px-1 py-0.5 text-right text-xs ${EVENT_KINDS[e.kind]?.color}`}>
                  {fmtTime(e.starts_at)} {e.title}{view === "week" && e.location ? ` · ${e.location}` : ""}
                </button>))}</div>
            </div>);
        })}
      </div>
      <p className="mt-2 text-xs text-gray-400">דאבל קליק על יום כדי להוסיף אירוע.</p>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "עריכת אירוע" : "אירוע חדש"}>
        {edit && <form onSubmit={save} className="space-y-3">
          <div><label className="label">כותרת</label><input className="input" required value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
          <div><label className="label">סוג</label><select className="input" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>{Object.entries(EVENT_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">התחלה</label><input className="input" type="datetime-local" required value={toLocalInput(edit.starts_at!)} onChange={(e) => setEdit({ ...edit, starts_at: new Date(e.target.value).toISOString() })} /></div>
            <div><label className="label">סיום</label><input className="input" type="datetime-local" value={edit.ends_at ? toLocalInput(edit.ends_at) : ""} onChange={(e) => setEdit({ ...edit, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
          </div>
          <div><label className="label">מיקום</label><input className="input" value={edit.location || ""} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></div>
          <div><label className="label">הערות</label><textarea className="input" rows={3} value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
          <div className="flex gap-2"><button className="btn-primary flex-1">שמירה</button>{edit.id && <button type="button" className="btn-danger" onClick={del}>מחיקה</button>}</div>
        </form>}
      </Modal>
    </div>
  );
}
