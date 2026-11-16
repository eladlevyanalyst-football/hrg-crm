"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayers, useSupabase } from "@/lib/useData";
import { SESSION_TYPES, scoreColor, todayISO, wellnessScore } from "@/lib/labels";
import type { Rpe, Wellness } from "@/lib/types";

const shift = (d: string, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

export default function WellnessPage() {
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
    const chronic = mine.reduce((a, r) => a + r.load, 0) / 4; // avg weekly load over 4 weeks
    return { today, acute, chronic, acwr: chronic ? acute / chronic : null };
  }
  const acwrColor = (v: number | null) => v == null ? "" : v > 1.5 ? "bg-red-100 text-red-800" : v < 0.8 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800";
  const filled = new Set(well.map((w) => w.player_id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">וולבינג ו-RPE</h1>
        <div className="mr-auto flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setDate(shift(date, -1))}>→</button>
          <input type="date" className="input w-40" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-ghost" onClick={() => setDate(shift(date, 1))}>←</button>
        </div>
      </div>

      <div className="card bg-red-50 text-sm">
        <b>קישור לשחקנים:</b> <span dir="ltr" className="select-all rounded bg-white px-2 py-0.5">{origin}/form</span>
        <span className="text-gray-600"> · שלחו בקבוצת הווטסאפ. בפעם הראשונה השחקן מזין את קוד הקבוצה, ומאז הטלפון זוכר.</span>
        <div className="mt-1 text-gray-600">מילאו היום: <b>{filled.size}</b> מתוך {players.length}{players.length - filled.size > 0 && <> · חסרים: {players.filter((p) => !filled.has(p.id)).map((p) => p.full_name).join(", ")}</>}</div>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr>
            <th>שחקן</th><th>וולבינג</th><th>שינה (ש׳)</th><th>איכות שינה</th><th>אנרגיה</th><th>שרירים</th><th>לחץ</th><th>מצב רוח</th>
            <th>RPE היום</th><th>עומס היום</th><th>עומס 7 ימים</th><th>ממוצע שבועי (28)</th><th>ACWR</th><th>הערות</th>
          </tr></thead>
          <tbody>{players.map((p) => {
            const w = well.find((x) => x.player_id === p.id);
            const s = w ? wellnessScore(w) : null;
            const l = loads(p.id);
            const cell = (v: number | null | undefined) => <td className={v != null && v <= 2 ? "font-bold text-red-700" : ""}>{v ?? "-"}</td>;
            return (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap"><Link href={`/players/${p.id}`} className="hover:underline">{p.full_name}</Link></td>
                <td><span className={`chip ${scoreColor(s)}`}>{s != null ? `${s}%` : "לא מילא"}</span></td>
                <td>{w?.sleep_hours ?? "-"}</td>{cell(w?.sleep_quality)}{cell(w?.fatigue)}{cell(w?.soreness)}{cell(w?.stress)}{cell(w?.mood)}
                <td className="whitespace-nowrap">{l.today.map((r) => `${r.rpe} (${SESSION_TYPES[r.session_type]}, ${r.duration_min}′)`).join(" + ") || "-"}</td>
                <td>{l.today.reduce((a, r) => a + r.load, 0) || "-"}</td>
                <td>{l.acute || "-"}</td><td>{Math.round(l.chronic) || "-"}</td>
                <td>{l.acwr != null ? <span className={`chip ${acwrColor(l.acwr)}`}>{l.acwr.toFixed(2)}</span> : "-"}</td>
                <td className="max-w-48 truncate text-gray-500">{[w?.notes, ...l.today.map((r) => r.notes)].filter(Boolean).join(" | ")}</td>
              </tr>);
          })}</tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">וולבינג: ממוצע 5 המדדים (1 עד 5) באחוזים. ירוק 75% ומעלה, צהוב 55% עד 74%, אדום מתחת. עומס = RPE × דקות. ACWR = עומס 7 ימים חלקי ממוצע שבועי של 28 ימים (ירוק 0.8 עד 1.5).</p>
    </div>
  );
}
