"use client";
import { useEffect, useRef, useState } from "react";

type M = { role: "user" | "assistant"; content: string };
const EXAMPLES = ["מי השחקנים עם וולבינג נמוך השבוע?", "מה העומס של כל שחקן ב-7 הימים האחרונים?", "אילו משימות פתוחות יש לפני המשחק הבא?", "תסכם לי את דוחות הסקאוטינג על חלוצים"];

export default function Chat() {
  const [msgs, setMsgs] = useState<M[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(q: string) {
    if (!q.trim() || busy) return;
    const next: M[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages: next }) });
      const j = await res.json();
      setMsgs([...next, { role: "assistant", content: j.answer || `⚠️ ${j.error || "שגיאה"}` }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "⚠️ אין חיבור, נסו שוב" }]);
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col">
      <h1 className="h1">צ'אט AI</h1><p className="sub">שאלות על השחקנים, העומסים, המשחקים והסקאוטינג. התשובות מבוססות על הנתונים במערכת.</p>
      <div className="card flex-1 space-y-3 overflow-y-auto">
        {msgs.length === 0 && <div className="space-y-2 text-sm text-gray-500">
          <p>שאלו כל שאלה על השחקנים, הוולבינג, העומסים, המשחקים, המשימות והסקאוטינג. התשובות מבוססות על הנתונים שבמערכת.</p>
          <div className="flex flex-wrap gap-2">{EXAMPLES.map((e) => <button key={e} className="chip border bg-white px-3 py-1 text-gray-700 hover:bg-gray-50" onClick={() => send(e)}>{e}</button>)}</div>
        </div>}
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${m.role === "user" ? "mr-0 ml-auto bg-[var(--brand)] text-white" : "ml-0 mr-auto bg-gray-100"}`}
            style={m.role === "user" ? { marginRight: 0, marginLeft: "auto" } : { marginLeft: 0, marginRight: "auto" }}>{m.content}</div>))}
        {busy && <div className="text-sm text-gray-400">חושב...</div>}
        <div ref={end} />
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="כתבו שאלה..." />
        <button className="btn-primary" disabled={busy}>שליחה</button>
      </form>
    </div>
  );
}
