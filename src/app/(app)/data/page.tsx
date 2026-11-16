"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import { useMe, useTable } from "@/lib/useData";
import { DATA_SOURCES, fmtDate, todayISO } from "@/lib/labels";
import { parseTable } from "@/lib/parse";
import type { DataImport, Match } from "@/lib/types";

export default function DataPage() {
  const { rows, reload, sb } = useTable<DataImport>("data_imports", "data_date", false, (q) => q.select("id,source,title,data_date,match_id,columns,created_at"));
  const { rows: matches } = useTable<Match>("matches", "match_date", false);
  const me = useMe();
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const router = useRouter();
  const src = sp.get("source") || "all";
  const setSrc = (v: string) => router.replace(v === "all" ? "/data" : `/data?source=${v}`);
  const [f, setF] = useState({ source: src === "stats" ? "opta" : "gps", title: "", data_date: todayISO(), match_id: "" });
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault(); if (!file) return;
    setBusy(true); setErr("");
    try {
      const t = await parseTable(file);
      if (!t.rows.length) throw new Error("הקובץ ריק או לא נקרא");
      const { error } = await sb.from("data_imports").insert({ ...f, title: f.title || file.name, match_id: f.match_id || null, columns: t.columns, rows: t.rows, uploaded_by: me?.id });
      if (error) throw error;
      setOpen(false); setFile(null); reload();
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }
  const list = rows.filter((r) => src === "all" || (src === "stats" ? r.source !== "gps" : r.source === src));
  const title = src === "gps" ? "נתוני GPS" : src === "stats" ? "נתוני דאטה" : "כל הנתונים";
  const sub = src === "gps" ? "קבצי ייצוא מ-K-Sport: אימונים ומשחקים." : src === "stats" ? "נתוני Opta, TruMedia ו-Wyscout שיובאו מקבצים." : "כל הקבצים שיובאו למערכת.";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h1 className="h1">{title}</h1><p className="sub mb-0">{sub}</p></div>
        <div className="flex gap-2">
          <div className="seg"><button className={src === "gps" ? "on" : ""} onClick={() => setSrc("gps")}>GPS</button><button className={src === "stats" ? "on" : ""} onClick={() => setSrc("stats")}>דאטה</button><button className={src === "all" ? "on" : ""} onClick={() => setSrc("all")}>הכל</button></div>
          <button className="btn-primary" onClick={() => setOpen(true)}>+ ייבוא קובץ</button>
        </div></div>
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="tbl"><thead><tr><th>תאריך</th><th>מקור</th><th>כותרת</th><th>משחק</th><th>עמודות</th></tr></thead>
          <tbody>{list.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td>{fmtDate(r.data_date)}</td><td>{DATA_SOURCES[r.source]}</td>
              <td><Link className="font-medium text-[var(--brand)] hover:underline" href={`/data/${r.id}`}>{r.title}</Link></td>
              <td>{matches.find((m) => m.id === r.match_id)?.opponent || ""}</td>
              <td className="text-gray-400">{r.columns.length}</td>
            </tr>))}</tbody></table>
        {list.length === 0 && <p className="p-4 text-sm text-gray-500">עוד לא יובאו נתונים. ייצאו קובץ CSV או Excel מ-K-Sport, Opta, TruMedia או Wyscout והעלו כאן.</p>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="ייבוא נתונים">
        <form onSubmit={upload} className="space-y-3">
          <div><label className="label">קובץ CSV או Excel</label><input type="file" accept=".csv,.xlsx,.xls" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} required /></div>
          <div><label className="label">מקור</label><select className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{Object.entries(DATA_SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label">כותרת</label><input className="input" placeholder="למשל: אימון יום ג׳" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">תאריך</label><input className="input" type="date" value={f.data_date} onChange={(e) => setF({ ...f, data_date: e.target.value })} /></div>
            <div><label className="label">קישור למשחק</label><select className="input" value={f.match_id} onChange={(e) => setF({ ...f, match_id: e.target.value })}><option value="">-</option>{matches.map((m) => <option key={m.id} value={m.id}>{m.opponent} ({fmtDate(m.match_date)})</option>)}</select></div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "מייבא..." : "ייבוא"}</button>
        </form>
      </Modal>
    </div>
  );
}
