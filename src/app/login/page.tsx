"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr("אימייל או סיסמה שגויים");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">HRG <span className="text-[var(--brand)]">●</span> צוות</h1>
        <p className="text-sm text-gray-500">כניסה לאנשי הצוות</p>
        <div><label className="label">אימייל</label><input className="input" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="label">סיסמה</label><input className="input" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "נכנס..." : "כניסה"}</button>
        <p className="text-center text-xs text-gray-400">התקנה ראשונה? <Link href="/setup" className="underline">יצירת מנהל ראשון</Link></p>
      </form>
    </div>
  );
}
