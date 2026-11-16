"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Crest from "@/components/Crest";

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
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-ink p-10 text-white md:flex">
        <div className="flex items-center gap-3"><Crest size={44} /><div><div className="font-display text-2xl font-bold">הפועל רמת גן</div><div className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Performance Hub · 26/27</div></div></div>
        <div><div className="font-display text-6xl font-extrabold leading-none">מרכז<br />ביצועים</div><div className="mt-3 h-1.5 w-24 bg-brand" /><p className="mt-4 max-w-sm text-sm text-gray-400">כל העבודה של המחלקה המקצועית במקום אחד: שחקנים, משחקים, נתונים, וולבינג וסקאוטינג.</p></div>
        <div className="text-xs text-gray-500">המחלקה המקצועית</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <form onSubmit={submit} className="w-full max-w-sm space-y-3">
          <div className="mb-6 flex items-center gap-3 md:hidden"><Crest size={36} /><span className="font-display text-2xl font-bold">הפועל רמת גן</span></div>
          <h1 className="h1">כניסה</h1>
          <p className="sub">לאנשי הצוות המקצועי</p>
          <div><label className="label">אימייל</label><input className="input py-2" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="label">סיסמה</label><input className="input py-2" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {err && <p className="text-sm text-brand">{err}</p>}
          <button className="btn-primary w-full py-2.5" disabled={busy}>{busy ? "נכנס..." : "כניסה"}</button>
          <p className="pt-2 text-center text-xs text-gray-400">התקנה ראשונה? <Link href="/setup" className="underline">יצירת מנהל ראשון</Link></p>
        </form>
      </div>
    </div>
  );
}
