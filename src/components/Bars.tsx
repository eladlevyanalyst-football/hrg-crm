/** Bar chart (SVG, no deps): brand bars, highest bar in black, dashed average line. */
export default function Bars({ data, height = 170, unit = "", showAvg = true }: {
  data: { label: string; value: number; color?: string }[]; height?: number; color?: string; unit?: string; showAvg?: boolean;
}) {
  if (!data.length) return <p className="py-6 text-center text-sm text-gray-400">אין נתונים</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const avg = data.reduce((a, d) => a + d.value, 0) / data.length;
  const bw = 30, gap = 10, top = 18, w = Math.max(data.length * (bw + gap) + 60, 240);
  const y = (v: number) => top + height - (v / max) * height;
  return (
    <div className="overflow-x-auto">
      <svg width={w} height={height + top + 34} className="block" style={{ direction: "ltr" }}>
        <line x1={0} x2={w} y1={top + height} y2={top + height} stroke="#d1d5db" />
        {data.map((d, i) => {
          const x = i * (bw + gap) + 8;
          const isMax = d.value === max;
          return (
            <g key={i}>
              <title>{`${d.label}: ${d.value}${unit}`}</title>
              <rect x={x} y={y(d.value)} width={bw} height={top + height - y(d.value)} fill={d.color || (isMax ? "#0e0e10" : "#d4001a")} />
              <text x={x + bw / 2} y={y(d.value) - 4} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="Barlow Condensed, Arial" fill="#111">{Math.round(d.value * 10) / 10}</text>
              <text x={x + bw / 2} y={top + height + 14} textAnchor="middle" fontSize="10" fill="#6b7280">{d.label.length > 7 ? d.label.slice(0, 7) + "…" : d.label}</text>
            </g>
          );
        })}
        {showAvg && <>
          <line x1={0} x2={data.length * (bw + gap) + 6} y1={y(avg)} y2={y(avg)} stroke="#0e0e10" strokeDasharray="4 3" />
          <text x={data.length * (bw + gap) + 10} y={y(avg) + 4} fontSize="11" fontWeight="700" fill="#0e0e10" fontFamily="Barlow Condensed, Arial">ממוצע {Math.round(avg * 10) / 10}</text>
        </>}
      </svg>
    </div>
  );
}
