"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlayers, useSupabase } from "@/lib/useData";
import { SESSION_TYPES, scoreColor, todayISO, wellnessScore } from "@/lib/labels";
import type { Rpe, Wellness } from "@/lib/types";

const shift = (d: string, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

export default function WellnessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const view = sp.get("view") === "rpe" ? "rpe" : "wellness";
  const sb = useSupabase();
  const { rows: all } = usePlayers();
  const players = all.filter((p) => p.active);
  const [date, setDate] = useState(todayISO());
  const [well, setWell] = useState<Wellness[]>([]);
  const [rpe28, setRpe28] = useState<Rpe[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    sb.from("wellness").select("*").eq("entry_date", date).then(({ data }) => setWell(data || []));
    sb.from("rpe").select("*").gt("entry_date", shift(date, -28)).lte("entry_date", date).then(({ data }) => setRpe28(data || []));
  }, [sb, date]);

  function loads(pid: string) {
    const mine = rpe28.filter((r) => r.player_id === pid);
    const today = mine.filter((r) => r.entry_date === date);
    const acute = mine.filter((r) => r.entry_date > shift(date, -7)).reduce((a, r) => a + r.load, 0);
    const chronic = mine.reduce((a, r) => a + r.load, 0) / 4;
    return { today, todayLoad: today.reduce((a, r) => a + r.load, 0), acute, chronic, acwr: chronic ? acute / chronic : null };
  }
  const acwrColor = (v: number | null) => v == null ? "" : v > 1.5 ? "bg-brand-soft text-brand" : v < 0.8 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800";
  const filled = new Set(well.map((w) => w.player_id));
  const scores = well.map(wellnessScore).filter((x): x is number => x != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const low = scores.filter((s) => s < 55).length;
  const L = players.map((p) => ({ p, l: loads(p.id) }));
  const todayRpe = rpe28.filter((r) => r.entry_date === date);
  const teamLoad = todayRpe.reduce((a, r) => a + r.load, 0);
  const avgRpe = todayRpe.length ? todayRpe.reduce((a, r) => a + r.rpe, 0) / todayRpe.length : null;
  const highAcwr = L.filter((x) => x.l.acwr != null && x.l.acwr > 1.5).length;
  const rpeFilled = new Set(todayRpe.map((r) => r.player_id));

  const setView = (v: string) => router.replace(`/wellness?view=${v}`);
  const cell = (v: number | null | undefined) => <td className={`num text-center ${v != null && v <= 2 ? "text-brand" : ""}`}>{v ?? "–"}</td>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{view === "rpe" ? "RPE ועומסים" : "וולבינג"}</h1>
          <p className="sub mb-0">{view === "rpe" ? "דיווחי מאמץ אחרי אימון ומשחק, עומס יומי, שבועי ויחס עומסים (ACWR)." : "דיווח בוקר של השחקנים: שינה, אנרגיה, כאבי שרירים, לחץ ומצב רוח."}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="seg"><button className={view === "wellness" ? "on" : ""} onClick={() => setView("wellness")}>וולבינג</button><button className={view === "rpe" ? "on" : ""} onClick={() => setView("rpe")}>RPE</button></div>
          <button className="btn-ghost px-2" onClick={() => setDate(shift(date, -1))}>→</button>
          <input type="date" className="input w-36" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-ghost px-2" onClick={() => setDate(shift(date, 1))}>←</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {view === "wellness" ? <>
          <div className="kpi"><div className="kpi-label">מילאו היום</div><div className="kpi-value">{filled.size}<span className="text-xl text-gray-400"> / {players.length}</span></div></div>
          <div className="kpi"><div className="kpi-label">ממוצע וולבינג</div><div className="kpi-value">{avgScore ?? "–"}{avgScore != null && <span className="text-xl">%</span>}</div></div>
          <div className="kpi"><div className="kpi-label">דורשים תשומת לב</div><div className="kpi-value">{low}</div><div className="kpi-sub">מתחת ל-55%</div></div>
          <div className="kpi"><div className="kpi-label">ממוצע שעות שינה</div><div className="kpi-value">{well.length ? (well.reduce((a, w) => a + (Number(w.sleep_hours) || 0), 0) / well.length).toFixed(1) : "–"}</div></div>
        </> : <>
          <div className="kpi"><div className="kpi-label">דיווחו היום</div><div className="kpi-value">{rpeFilled.size}<span className="text-xl text-gray-400"> / {players.length}</span></div></div>
          <div className="kpi"><div className="kpi-label">עומס קבוצתי היום</div><div className="kpi-value">{teamLoad || "–"}</div><div className="kpi-sub">RPE × דקות</div></div>
          <div className="kpi"><div className="kpi-label">RPE ממוצע</div><div className="kpi-value">{avgRpe ? avgRpe.toFixed(1) : "–"}</div></div>
          <div className="kpi"><div className="kpi-label">ACWR גבוה</div><div className="kpi-value">{highAcwr}</div><div className="kpi-sub">שחקנים מעל 1.5</div></div>
        </>}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm">
        <b>קישור לשחקנים:</b><span dir="ltr" className="select-all rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{origin}/form</span>
        <span className="text-gray-500">שולחים בקבוצת הווטסאפ. בפעם הראשונה השחקן מזין את קוד הקבוצה.</span>
        {(view === "wellness" ? players.length - filled.size : players.length - rpeFilled.size) > 0 && <span className="text-gray-500">· חסרים: {players.filter((p) => !(view === "wellness" ? filled : rpeFilled).has(p.id)).map((p) => p.full_name).join(", ")}</span>}
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="tbl">
          {view === "wellness" ? <>
            <thead><tr><th>#</th><th>שחקן</th><th>וולבינג</th><th className="text-center">שינה (ש׳)</th><th className="text-center">איכות שינה</th><th className="text-center">אנרגיה</th><th className="text-center">שרירים</th><th className="text-center">לחץ</th><th className="text-center">מצב רוח</th><th>הערות</th></tr></thead>
            <tbody>{players.map((p) => {
              const w = well.find((x) => x.player_id === p.id);
              const s = w ? wellnessScore(w) : null;
              return (
                <tr key={p.id}>
                  <td className="num text-gray-400">{p.shirt_number}</td>
                  <td className="whitespace-nowrap font-semibold"><Link href={`/players/${p.id}`} className="hover:underline">{p.full_name}</Link></td>
                  <td><span className={`chip ${scoreColor(s)}`}>{s != null ? `${s}%` : "לא מילא"}</span></td>
                  <td className="num text-center">{w?.sleep_hours ?? "–"}</td>{cell(w?.sleep_quality)}{cell(w?.fatigue)}{cell(w?.soreness)}{cell(w?.stress)}{cell(w?.mood)}
                  <td className="max-w-56 truncate text-gray-500">{w?.notes}</td>
                </tr>);
            })}</tbody>
          </> : <>
            <thead><tr><th>#</th><th>שחקן</th><th>RPE היום</th><th className="text-center">עומס היום</th><th className="text-center">עומס 7 ימים</th><th className="text-center">ממוצע שבועי (28)</th><th className="text-center">ACWR</th><th>הערות</th></tr></thead>
            <tbody>{L.map(({ p, l }) => (
              <tr key={p.id}>
                <td className="num text-gray-400">{p.shirt_number}</td>
                <td className="whitespace-nowrap font-semibold"><Link href={`/players/${p.id}`} className="hover:underline">{p.full_name}</Link></td>
                <td className="whitespace-nowrap">{l.today.map((r) => `${r.rpe} · ${SESSION_TYPES[r.session_type]} ${r.duration_min}′`).join(" + ") || <span className="text-gray-400">לא דיווח</span>}</td>
                <td className="num text-center">{l.todayLoad || "–"}</td>
                <td className="num text-center">{l.acute || "–"}</td>
                <td className="num text-center">{Math.round(l.chronic) || "–"}</td>
                <td className="text-center">{l.acwr != null ? <span className={`chip ${acwrColor(l.acwr)}`}>{l.acwr.toFixed(2)}</span> : "–"}</td>
                <td className="max-w-56 truncate text-gray-500">{l.today.map((r) => r.notes).filter(Boolean).join(" | ")}</td>
              </tr>))}</tbody>
          </>}
        </table>
      </div>
      <p className="text-xs text-gray-500">{view === "wellness" ? "וולבינג: ממוצע 5 המדדים (1 עד 5) באחוזים. ירוק 75% ומעלה, צהוב 55% עד 74%, אדום מתחת. מספר אדום = ציון 2 ומטה." : "עומס = RPE × דקות. ACWR = עומס 7 ימים חלקי הממוצע השבועי של 28 ימים. ירוק 0.8 עד 1.5, צהוב מתחת, אדום מעל."}</p>
    </div>
  );
}
