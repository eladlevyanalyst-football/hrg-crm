"use client";
import { useState } from "react";
import { POSITIONS } from "@/lib/labels";
import type { Player } from "@/lib/types";
import { useSupabase } from "@/lib/useData";

const EMPTY: Partial<Player> = { full_name: "", active: true };

export default function PlayerForm({ player, onSaved }: { player?: Player | null; onSaved: () => void }) {
  const sb = useSupabase();
  const [f, setF] = useState<Partial<Player>>(player || EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Player, v: string | boolean) => setF({ ...f, [k]: v === "" ? null : v });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { id, ...rest } = f;
    if (id) await sb.from("players").update(rest).eq("id", id);
    else await sb.from("players").insert(rest);
    setBusy(false); onSaved();
  }
  const field = (k: keyof Player, label: string, type = "text", ltr = false) => (
    <div><label className="label">{label}</label>
      <input className="input" type={type} dir={ltr ? "ltr" : undefined} value={(f[k] as string | number | null) ?? ""} onChange={(e) => set(k, e.target.value)} /></div>
  );

  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><label className="label">שם מלא *</label><input className="input" required value={f.full_name || ""} onChange={(e) => set("full_name", e.target.value)} /></div>
      {field("shirt_number", "מספר חולצה", "number")}
      <div><label className="label">עמדה</label><select className="input" value={f.position || ""} onChange={(e) => set("position", e.target.value)}><option value="">-</option>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select></div>
      {field("birth_date", "תאריך לידה", "date")}
      {field("nationality", "אזרחות")}
      {field("phone", "טלפון", "tel", true)}
      {field("email", "אימייל", "email", true)}
      {field("height_cm", "גובה (ס\"מ)", "number")}
      {field("weight_kg", "משקל (ק\"ג)", "number")}
      <div><label className="label">רגל</label><select className="input" value={f.foot || ""} onChange={(e) => set("foot", e.target.value)}><option value="">-</option><option>ימין</option><option>שמאל</option><option>שתיהן</option></select></div>
      {field("contract_until", "חוזה עד", "date")}
      {field("agent", "סוכן")}
      {field("photo_url", "קישור לתמונה", "url", true)}
      <div><label className="label">מצב</label><select className="input" value={f.availability || "available"} onChange={(e) => set("availability", e.target.value)}><option value="available">זמין</option><option value="doubtful">בספק</option><option value="injured">פצוע</option></select></div>
      {field("injury_note", "פירוט פציעה")}
      <div className="col-span-2"><label className="label">הערות</label><textarea className="input" rows={3} value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} /></div>
      <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active ?? true} onChange={(e) => set("active", e.target.checked)} /> שחקן פעיל בסגל</label>
      <button className="btn-primary col-span-2" disabled={busy}>{busy ? "שומר..." : "שמירה"}</button>
    </form>
  );
}
