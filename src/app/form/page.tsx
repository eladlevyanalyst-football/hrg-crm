"use client";
import { useEffect, useState } from "react";

type P = { id: string; full_name: string; shirt_number: number | null };
const SCALES: { key: string; label: string; low: string; high: string }[] = [
  { key: "sleep_quality", label: "איכות שינה", low: "גרועה", high: "מצוינת" },
  { key: "fatigue", label: "רמת אנרגיה", low: "מותש", high: "רענן" },
  { key: "soreness", label: "כאבי שרירים", low: "כואב מאוד", high: "בלי כאבים" },
  { key: "stress", label: "לחץ", low: "לחוץ מאוד", high: "רגוע" },
  { key: "mood", label: "מצב רוח", low: "רע", high: "מצוין" },
];
const RPE_TEXT = ["", "קל מאוד", "קל", "בינוני", "קצת קשה", "קשה", "קשה", "קשה מאוד", "קשה מאוד", "כמעט מקסימלי", "מקסימלי"];
const store = { get: (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} } };

export default function PlayerForm() {
  const [code, setCode] = useState("");
  const [players, setPlayers] = useState<P[] | null>(null);
  const [pid, setPid] = useState("");
  const [kind, setKind] = useState<"wellness" | "rpe">("wellness");
  const [w, setW] = useState<Record<string, string>>({ sleep_hours: "" });
  const [r, setR] = useState({ rpe: "", duration_min: "90", session_type: "training", notes: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function enter(c: string) {
    setErr("");
    const res = await fetch(`/api/form?code=${encodeURIComponent(c)}`);
    if (!res.ok) { setErr(res.status === 401 ? "קוד שגוי" : "תקלה בשרת, נסו שוב מאוחר יותר"); return; }
    setPlayers((await res.json()).players);
    store.set("hrg_code", c);
  }
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("code");
    const c = url || store.get("hrg_code");
    setPid(store.get("hrg_player"));
    if (c) { setCode(c); enter(c); }
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    store.set("hrg_player", pid);
    const body = kind === "wellness" ? { ...w, kind, code, player_id: pid } : { ...r, kind, code, player_id: pid };
    const res = await fetch("/api/form", { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) { setErr((await res.json()).error || "שגיאה"); return; }
    setMsg(kind === "wellness" ? "תודה! הוולבינג נשמר ✅" : "תודה! ה-RPE נשמר ✅");
    if (kind === "wellness") setW({ sleep_hours: "" }); else setR({ ...r, rpe: "", notes: "" });
  }

  if (!players) return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="card w-full max-w-sm space-y-3" onSubmit={(e) => { e.preventDefault(); enter(code); }}>
        <h1 className="text-xl font-bold">HRG · דיווח שחקנים</h1>
        <div><label className="label">קוד קבוצה</label><input className="input" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} /></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full">כניסה</button>
      </form>
    </div>);

  const wellReady = pid && SCALES.every((s) => w[s.key]);
  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-xl font-bold">HRG · דיווח שחקנים</h1>
      <form onSubmit={send} className="space-y-4">
        <div className="card">
          <label className="label">מי אתה?</label>
          <select className="input text-base" value={pid} onChange={(e) => setPid(e.target.value)} required>
            <option value="">בחר שם</option>{players.map((p) => <option key={p.id} value={p.id}>{p.shirt_number ? `${p.shirt_number} · ` : ""}{p.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setKind("wellness")} className={`btn ${kind === "wellness" ? "bg-[var(--brand)] text-white" : "bg-white border"}`}>☀️ בוקר: וולבינג</button>
          <button type="button" onClick={() => setKind("rpe")} className={`btn ${kind === "rpe" ? "bg-[var(--brand)] text-white" : "bg-white border"}`}>🏃 אחרי אימון: RPE</button>
        </div>

        {kind === "wellness" ? (
          <div className="card space-y-4">
            <div><label className="label">כמה שעות ישנת?</label><input className="input text-base" type="number" step="0.5" min="0" max="16" inputMode="decimal" value={w.sleep_hours} onChange={(e) => setW({ ...w, sleep_hours: e.target.value })} /></div>
            {SCALES.map((s) => (
              <div key={s.key}>
                <div className="label">{s.label}</div>
                <div className="grid grid-cols-5 gap-1">{[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setW({ ...w, [s.key]: String(n) })}
                    className={`rounded-lg border py-3 text-lg font-semibold ${w[s.key] === String(n) ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "bg-white"}`}>{n}</button>))}</div>
                <div className="mt-0.5 flex justify-between text-[11px] text-gray-400"><span>{s.low}</span><span>{s.high}</span></div>
              </div>))}
            <div><label className="label">משהו שחשוב שנדע? (לא חובה)</label><textarea className="input" rows={2} value={w.notes || ""} onChange={(e) => setW({ ...w, notes: e.target.value })} /></div>
            <button className="btn-primary w-full py-3 text-base" disabled={!wellReady}>שליחה</button>
          </div>
        ) : (
          <div className="card space-y-4">
            <div><label className="label">סוג</label><select className="input text-base" value={r.session_type} onChange={(e) => setR({ ...r, session_type: e.target.value })}><option value="training">אימון</option><option value="match">משחק</option><option value="gym">חדר כושר</option><option value="other">אחר</option></select></div>
            <div>
              <div className="label">כמה קשה היה? (1 עד 10)</div>
              <div className="grid grid-cols-5 gap-1">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button type="button" key={n} onClick={() => setR({ ...r, rpe: String(n) })}
                  className={`rounded-lg border py-3 text-lg font-semibold ${r.rpe === String(n) ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "bg-white"}`}>{n}</button>))}</div>
              {r.rpe && <div className="mt-1 text-center text-sm text-gray-600">{RPE_TEXT[+r.rpe]}</div>}
            </div>
            <div><label className="label">כמה דקות?</label><input className="input text-base" type="number" inputMode="numeric" min="1" max="300" value={r.duration_min} onChange={(e) => setR({ ...r, duration_min: e.target.value })} /></div>
            <div><label className="label">הערות (לא חובה)</label><textarea className="input" rows={2} value={r.notes} onChange={(e) => setR({ ...r, notes: e.target.value })} /></div>
            <button className="btn-primary w-full py-3 text-base" disabled={!pid || !r.rpe}>שליחה</button>
          </div>
        )}
        {msg && <p className="rounded-lg bg-green-100 p-3 text-center text-green-800">{msg}</p>}
        {err && <p className="rounded-lg bg-red-100 p-3 text-center text-red-800">{err}</p>}
      </form>
    </div>
  );
}
