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
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/data" className="text-sm text-gray-500">→ נתונים</Link>
        <h1 className="text-2xl font-bold">{d.title}</h1>
        <span className="text-sm text-gray-500">{DATA_SOURCES[d.source]} · {fmtDate(d.data_date)} · {d.rows.length} שורות</span>
        <button className="btn-danger mr-auto" onClick={del}>מחיקה</button>
      </div>
      {numeric.length > 0 && <div className="card">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <span>גרף:</span>
          <select className="input w-56" value={metric} onChange={(e) => setMetric(e.target.value)}>{numeric.map((c) => <option key={c}>{c}</option>)}</select>
          <span>לפי</span>
          <select className="input w-48" value={labelCol} onChange={(e) => setLabelCol(e.target.value)}>{d.columns.map((c) => <option key={c}>{c}</option>)}</select>
          <span className="text-gray-500">ממוצע: <b>{Math.round(avg * 10) / 10}</b></span>
        </div>
        <Bars data={chart} height={200} />
      </div>}
      <div className="card overflow-x-auto">
        <input className="input mb-2 w-60" placeholder="סינון..." value={q} onChange={(e) => setQ(e.target.value)} />
        <table className="tbl">
          <thead><tr>{d.columns.map((c) => <th key={c} className="cursor-pointer select-none" onClick={() => setSort({ col: c, asc: sort?.col === c ? !sort.asc : false })}>{c}{sort?.col === c ? (sort.asc ? " ▲" : " ▼") : ""}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="hover:bg-gray-50">{d.columns.map((c) => <td key={c} className="whitespace-nowrap">{String(r[c] ?? "")}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
