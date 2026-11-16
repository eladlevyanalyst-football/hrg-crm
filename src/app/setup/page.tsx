"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Setup() {
  const router = useRouter();
  const [f, setF] = useState({ full_name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/setup", { method: "POST", body: JSON.stringify(f) });
    const j = await res.json();
    if (!res.ok) { setBusy(false); return setErr(j.error); }
    await createClient().auth.signInWithPassword({ email: f.email, password: f.password });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold">יצירת מנהל ראשון</h1>
        <p className="text-sm text-gray-500">עובד רק פעם אחת, כשעדיין אין משתמשים במערכת. את שאר הצוות מוסיפים אחר כך מעמוד "אנשי צוות".</p>
        <div><label className="label">שם מלא</label><input className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required /></div>
        <div><label className="label">אימייל</label><input className="input" dir="ltr" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
        <div><label className="label">סיסמה (לפחות 8 תווים)</label><input className="input" dir="ltr" type="password" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "יוצר..." : "יצירה וכניסה"}</button>
      </form>
    </div>
  );
}
