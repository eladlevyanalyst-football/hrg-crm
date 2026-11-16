"use client";
import { useState } from "react";
import Modal from "@/components/Modal";
import { useMe, useStaff } from "@/lib/useData";

export default function StaffPage() {
  const me = useMe();
  const { rows, reload, sb } = useStaff();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", password: "", job_title: "", role: "staff" });
  const [err, setErr] = useState("");
  const isAdmin = me?.role === "admin";

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/staff", { method: "POST", body: JSON.stringify(f) });
    const j = await res.json();
    if (!res.ok) return setErr(j.error);
    setOpen(false); setF({ full_name: "", email: "", password: "", job_title: "", role: "staff" }); reload();
  }
  async function remove(id: string) {
    if (!confirm("למחוק את איש הצוות? הוא לא יוכל להיכנס יותר.")) return;
    await fetch("/api/staff", { method: "DELETE", body: JSON.stringify({ id }) });
    reload();
  }
  async function updateTitle(id: string, job_title: string) {
    await sb.from("profiles").update({ job_title }).eq("id", id);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between"><div><h1 className="h1">אנשי צוות</h1><p className="sub">מי נכנס למערכת. רק מנהל יכול להוסיף ולהסיר.</p></div>
        {isAdmin && <button className="btn-primary" onClick={() => setOpen(true)}>+ הוספת איש צוות</button>}</div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>שם</th><th>תפקיד</th><th>הרשאה</th><th></th></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">{p.full_name}</td>
              <td><input className="input py-1" defaultValue={p.job_title || ""} disabled={!isAdmin && me?.id !== p.id} onBlur={(e) => updateTitle(p.id, e.target.value)} placeholder="למשל: מאמן כושר" /></td>
              <td>{p.role === "admin" ? "מנהל" : "צוות"}</td>
              <td>{isAdmin && p.id !== me?.id && <button className="btn-danger" onClick={() => remove(p.id)}>מחיקה</button>}</td>
            </tr>))}</tbody>
        </table>
      </div>
      {!isAdmin && <p className="mt-3 text-sm text-gray-500">רק מנהל יכול להוסיף או להסיר אנשי צוות.</p>}
      <Modal open={open} onClose={() => setOpen(false)} title="איש צוות חדש">
        <form onSubmit={add} className="space-y-3">
          <div><label className="label">שם מלא</label><input className="input" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><label className="label">תפקיד</label><input className="input" value={f.job_title} onChange={(e) => setF({ ...f, job_title: e.target.value })} /></div>
          <div><label className="label">אימייל (לכניסה)</label><input className="input" dir="ltr" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><label className="label">סיסמה ראשונית (לפחות 8 תווים)</label><input className="input" dir="ltr" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div><label className="label">הרשאה</label><select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="staff">צוות</option><option value="admin">מנהל</option></select></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">הוספה</button>
        </form>
      </Modal>
    </div>
  );
}
