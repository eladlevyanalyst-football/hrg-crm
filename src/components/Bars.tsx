/** Minimal horizontal-friendly vertical bar chart (SVG, no deps). */
export default function Bars({ data, height = 160, color = "var(--brand)", unit = "" }: {
  data: { label: string; value: number; color?: string }[]; height?: number; color?: string; unit?: string;
}) {
  if (!data.length) return <p className="text-sm text-gray-400">אין נתונים</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = Math.max(data.length * 34, 200);
  return (
    <div className="overflow-x-auto">
      <svg width={w} height={height + 40} className="block" style={{ direction: "ltr" }}>
        {data.map((d, i) => {
          const h = (d.value / max) * height;
          const x = i * 34 + 6;
          return (
            <g key={i}>
              <title>{`${d.label}: ${d.value}${unit}`}</title>
              <rect x={x} y={height - h + 14} width={22} height={h} rx={3} fill={d.color || color} />
              <text x={x + 11} y={height - h + 10} textAnchor="middle" fontSize="10" fill="#374151">{Math.round(d.value * 10) / 10}</text>
              <text x={x + 11} y={height + 30} textAnchor="middle" fontSize="9" fill="#6b7280">{d.label.slice(0, 6)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
