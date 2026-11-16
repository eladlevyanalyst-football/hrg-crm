/** Club crest. Put the official logo at /public/logo.png to replace the placeholder shield. */
export default function Crest({ size = 40 }: { size?: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size * 1.15 }}>
      <svg viewBox="0 0 40 46" width={size} height={size * 1.15} aria-hidden>
        <path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="#fff" />
        <path d="M20 4 L35 9 V22 C35 32 28 38 20 41.5 C12 38 5 32 5 22 V9 Z" fill="#d4001a" />
        <path d="M5 16 H35 V22 H5 Z" fill="#fff" />
        <text x="20" y="21" textAnchor="middle" fontFamily="Barlow Condensed, Arial" fontWeight="800" fontSize="8" fill="#d4001a">HRG</text>
      </svg>
    </span>
  );
}
