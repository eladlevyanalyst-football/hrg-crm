import Papa from "papaparse";
import * as XLSX from "xlsx";

type Row = Record<string, string | number | null>;

/** Parse CSV / XLSX into columns + rows (numbers converted where possible). */
export async function parseTable(file: File): Promise<{ columns: string[]; rows: Row[] }> {
  let raw: Record<string, unknown>[] = [];
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    const wb = XLSX.read(await file.arrayBuffer());
    raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  } else {
    const text = await file.text();
    raw = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true }).data;
  }
  const columns = Array.from(new Set(raw.flatMap((r) => Object.keys(r)))).filter((c) => c && !c.startsWith("__EMPTY"));
  const rows = raw.map((r) => {
    const o: Row = {};
    for (const c of columns) {
      const v = r[c];
      if (v == null || v === "") o[c] = null;
      else if (typeof v === "number") o[c] = v;
      else {
        const s = String(v).trim();
        const n = Number(s.replace(/,/g, ""));
        o[c] = s !== "" && Number.isFinite(n) && /^-?[\d,.]+$/.test(s) ? n : s;
      }
    }
    return o;
  });
  return { columns, rows };
}
