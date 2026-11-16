"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Bars from "@/components/Bars";
import { useSupabase } from "@/lib/useData";
import { DATA_SOURCES, fmtDate } from "@/lib/labels";
import type { DataImport } from "@/lib/types";

export default function DataView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sb = useSupabase();
  const [d, setD] = useState<DataImport | null>(null);
  const [sort, setSort] = useState<{ col: string; asc: boolean } | null>(null);
  const [metric, setMetric] = useState("");
  const [labelCol, setLabelCol] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    sb.from("data_imports").select("*").eq("id", id).single().then(({ data }) => {
      const x = data as DataImport; setD(x);
      if (!x) return;
      const num = x.columns.filter((c) => x.rows.some((r) => typeof r[c] === "number"));
      const txt = x.columns.filter((c) => !num.includes(c));
      setLabelCol(txt.find((c) => /name|player|שם|שחקן/i.test(c)) || txt[0] || x.columns[0]);
      setMetric(num.find((c) => /dist|מרחק/i.test(c)) || num[0] || "");
    });
  }, [sb, id]);

  const numeric = useMemo(() => d ? d.columns.filter((c) => d.rows.some((r) => typeof r[c] === "number")) : [], [d]);
  const rows = useMemo(() => {
    if (!d) return [];
    let r = d.rows.filter((x) => !q || Object.values(x).some((v) => String(v ?? "").includes(q)));
    if (sort) r = [...r].sort((a, b) => {
      const x = a[sort.col], y = b[sort.col];
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "he");
      return sort.asc ? c : -c;
    });
    return r;
  }, [d, sort, q]);

  if (!d) return <p>טוען...</p>;
  const chart = metric ? rows.filter((r) => typeof r[metric] === "number").map((r) => ({ label: String(r[labelCol] ?? ""), value: r[metric] as number })) : [];
  const avg = chart.length ? chart.reduce((a, b) => a + b.value, 0) / chart.length : 0;

  async function del() {
    if (!confirm("למחוק את הייבוא?")) return;
    await sb.from("data_imports").delete().eq("id", id); router.push("/data");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={d.source === "gps" ? "/data?source=gps" : "/data?source=stats"} className="text-xs font-semibold text-gray-500">→ {d.source === "gps" ? "נתוני GPS" : "נתוני דאטה"}</Link>
          <h1 className="h1 mt-1">{d.title}</h1>
        </div>
        <button className="btn-danger" onClick={del}>מחיקה</button>
      </div>
      <div className="strip">
        <div><span className="strip-label">מקור</span><span className="strip-value">{DATA_SOURCES[d.source]}</span></div>
        <div><span className="strip-label">תאריך</span><span className="strip-value">{fmtDate(d.data_date) || "–"}</span></div>
        <div><span className="strip-label">שורות</span><span className="strip-value">{d.rows.length}</span></div>
        <div><span className="strip-label">מדדים</span><span className="strip-value">{numeric.length}</span></div>
      </div>
      {numeric.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {numeric.slice(0, 6).map((c) => {
          const vals = d.rows.map((r) => r[c]).filter((v): v is number => typeof v === "number");
          const sum = vals.reduce((a, b) => a + b, 0);
          const mean = vals.length ? sum / vals.length : 0;
          const big = Math.abs(mean) >= 50;
          return (
            <button key={c} onClick={() => setMetric(c)} className={`kpi text-right ${metric === c ? "ring-2 ring-brand" : ""}`}>
              <div className="kpi-label truncate">{c}</div>
              <div className="kpi-value text-3xl">{(big ? sum : mean).toLocaleString("he-IL", { maximumFractionDigits: 1 })}</div>
              <div className="kpi-sub">{big ? `סה״כ · ממוצע ${mean.toLocaleString("he-IL", { maximumFractionDigits: 1 })}` : `ממוצע · שיא ${Math.max(...vals)}`}</div>
            </button>);
        })}
      </div>}
      {numeric.length > 0 && <div className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <h2 className="h2 mb-0 ml-2">{metric}</h2>
          <span className="text-gray-500">לפי</span>
          <select className="input w-44" value={labelCol} onChange={(e) => setLabelCol(e.target.value)}>{d.columns.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="input w-52" value={metric} onChange={(e) => setMetric(e.target.value)}>{numeric.map((c) => <option key={c}>{c}</option>)}</select>
          <span className="text-gray-500">ממוצע: <b className="num">{Math.round(avg * 10) / 10}</b></span>
        </div>
        <Bars data={chart} height={200} />
      </div>}
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <div className="p-2"><input className="input w-60" placeholder="סינון..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <table className="tbl">
          <thead><tr>{d.columns.map((c) => <th key={c} className="cursor-pointer select-none" onClick={() => setSort({ col: c, asc: sort?.col === c ? !sort.asc : false })}>{c}{sort?.col === c ? (sort.asc ? " ▲" : " ▼") : ""}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="hover:bg-gray-50">{d.columns.map((c) => <td key={c} className="whitespace-nowrap">{String(r[c] ?? "")}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
