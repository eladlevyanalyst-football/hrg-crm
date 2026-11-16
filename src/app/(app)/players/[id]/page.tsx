"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Bars from "@/components/Bars";
import Modal from "@/components/Modal";
import PlayerForm from "@/components/PlayerForm";
import { useSupabase } from "@/lib/useData";
import { AVAILABILITY, FILE_CATEGORIES, LIBRARY_CATEGORIES, age, fmtDate, scoreColor, wellnessScore } from "@/lib/labels";
import type { DataImport, MatchFile, Player, Rpe, Wellness } from "@/lib/types";
import { openFile } from "@/lib/files";

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sb = useSupabase();
  const [p, setP] = useState<Player | null>(null);
  const [well, setWell] = useState<Wellness[]>([]);
  const [rpe, setRpe] = useState<Rpe[]>([]);
  const [files, setFiles] = useState<MatchFile[]>([]);
  const [gps, setGps] = useState<{ imp: DataImport; row: Record<string, unknown> }[]>([]);
  const [edit, setEdit] = useState(false);

  async function load() {
    const since = new Date(); since.setDate(since.getDate() - 28);
    const s = since.toISOString().slice(0, 10);
    const { data: pl } = await sb.from("players").select("*").eq("id", id).single();
    setP(pl);
    sb.from("wellness").select("*").eq("player_id", id).gte("entry_date", s).order("entry_date").then(({ data }) => setWell(data || []));
    sb.from("rpe").select("*").eq("player_id", id).gte("entry_date", s).order("entry_date").then(({ data }) => setRpe(data || []));
    sb.from("match_files").select("*").eq("player_id", id).order("created_at", { ascending: false }).then(({ data }) => setFiles(data || []));
    if (pl) {
      const { data: imps } = await sb.from("data_imports").select("*").order("data_date", { ascending: false }).limit(30);
      const out: { imp: DataImport; row: Record<string, unknown> }[] = [];
      const last = pl.full_name.split(" ").slice(-1)[0];
      for (const imp of (imps || []) as DataImport[]) {
        const row = imp.rows.find((r) => Object.values(r).some((v) => typeof v === "string" && (v.includes(pl.full_name) || (last.length > 2 && v.includes(last)))));
        if (row) out.push({ imp, row });
      }
      setGps(out);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  async function del() {
    if (!confirm("למחוק את השחקן וכל הנתונים שלו?")) return;
    await sb.from("players").delete().eq("id", id);
    router.push("/players");
  }

  if (!p) return <p>טוען...</p>;
  const loadByDay: Record<string, number> = {};
  rpe.forEach((r) => { loadByDay[r.entry_date] = (loadByDay[r.entry_date] || 0) + r.load; });

  return (
    <div className="space-y-4">
      <div className="flex gap-2"><Link href="/players" className="btn-ghost text-xs">→ כל השחקנים</Link></div>
      <div className="flex flex-wrap items-center gap-4">
        {p.photo_url ? <img src={p.photo_url} alt="" className="h-24 w-24 rounded-md object-cover" /> :
          <div className="flex h-24 w-24 items-center justify-center rounded-md bg-gray-200 font-display text-4xl font-bold text-gray-400">{p.shirt_number ?? "?"}</div>}
        <div className="flex-1">
          <h1 className="h1">{p.full_name}</h1>
          <div className="mt-1 text-sm text-gray-500">#{p.shirt_number ?? "-"} · {[p.position, age(p.birth_date) && `גיל ${age(p.birth_date)}`, p.nationality, p.foot && `רגל ${p.foot}`].filter(Boolean).join(" · ")}</div>
          <span className={`chip mt-2 ${AVAILABILITY[p.availability || "available"]?.color}`}>{AVAILABILITY[p.availability || "available"]?.label}{p.injury_note ? ` · ${p.injury_note}` : ""}</span>
        </div>
        <button className="btn-ghost" onClick={() => setEdit(true)}>עריכה</button>
        <button className="btn-danger" onClick={del}>מחיקה</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card text-sm space-y-1">
          <div className="panel-head">פרטים אישיים</div>
          <div>טלפון: <span dir="ltr">{p.phone}</span></div>
          <div>אימייל: <span dir="ltr">{p.email}</span></div>
          <div>תאריך לידה: {fmtDate(p.birth_date)}</div>
          <div>גובה/משקל: {p.height_cm || "-"} / {p.weight_kg || "-"}</div>
          <div>חוזה עד: {fmtDate(p.contract_until)}</div>
          <div>סוכן: {p.agent}</div>
          {p.notes && <p className="whitespace-pre-wrap pt-2 text-gray-600">{p.notes}</p>}
        </div>
        <div className="card md:col-span-2">
          <div className="panel-head">וולבינג · 28 ימים</div>
          <Bars showAvg={false} data={well.map((w) => { const s = wellnessScore(w) || 0; return { label: w.entry_date.slice(5), value: s, color: s >= 75 ? "#16a34a" : s >= 55 ? "#ca8a04" : "#dc2626" }; })} unit="%" />
        </div>
        <div className="card md:col-span-3">
          <div className="panel-head">עומס RPE יומי · RPE × דקות</div>
          <Bars data={Object.entries(loadByDay).map(([d, v]) => ({ label: d.slice(5), value: v }))} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="h2">דיווחי וולבינג אחרונים</h2>
        <table className="tbl"><thead><tr><th>תאריך</th><th>ציון</th><th>שעות שינה</th><th>איכות שינה</th><th>עייפות</th><th>כאבי שרירים</th><th>לחץ</th><th>מצב רוח</th><th>הערות</th></tr></thead>
          <tbody>{[...well].reverse().slice(0, 10).map((w) => { const s = wellnessScore(w); return (
            <tr key={w.id}><td>{fmtDate(w.entry_date)}</td><td><span className={`chip ${scoreColor(s)}`}>{s}%</span></td><td>{w.sleep_hours}</td><td>{w.sleep_quality}</td><td>{w.fatigue}</td><td>{w.soreness}</td><td>{w.stress}</td><td>{w.mood}</td><td>{w.notes}</td></tr>); })}</tbody></table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="h2">נתוני GPS ונתונים מיובאים</h2>
        {gps.length === 0 && <p className="text-sm text-gray-500">לא נמצאו שורות עם שם השחקן בקבצים שיובאו.</p>}
        {gps.map(({ imp, row }) => (
          <div key={imp.id} className="mb-3">
            <Link href={`/data/${imp.id}`} className="text-sm font-medium hover:underline">{imp.title} · {fmtDate(imp.data_date)}</Link>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">{Object.entries(row).slice(0, 14).map(([k, v]) => <span key={k} className="rounded bg-gray-100 px-2 py-1">{k}: <b>{String(v ?? "")}</b></span>)}</div>
          </div>))}
      </div>

      <div className="card">
        <h2 className="h2">וידאו וקבצים אישיים</h2>
        {files.length === 0 && <p className="text-sm text-gray-500">אין קבצים אישיים. אפשר להעלות מתוך תיק משחק ולבחור את השחקן.</p>}
        <ul className="space-y-1 text-sm">{files.map((f) => (
          <li key={f.id}><button className="text-[var(--brand)] hover:underline" onClick={() => openFile(sb, f)}>{f.title}</button> <span className="text-gray-400">· {FILE_CATEGORIES[f.category] || LIBRARY_CATEGORIES[f.category]} · {fmtDate(f.created_at)}</span></li>))}</ul>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title="עריכת שחקן" wide>
        <PlayerForm player={p} onSaved={() => { setEdit(false); load(); }} />
      </Modal>
    </div>
  );
}
