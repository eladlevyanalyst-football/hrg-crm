const P: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  tasks: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  players: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a7 7 0 0 1 14 0v1M17 11a3 3 0 1 0 0-6M22 21v-1a5 5 0 0 0-4-4.9",
  folder: "M3 6h6l2 2h10v11H3z",
  film: "M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4",
  pulse: "M3 12h4l2-6 4 12 2-6h6",
  gps: "M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  heart: "M12 20s-8-4.5-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 10-8 10z",
  gauge: "M4 18a8 8 0 1 1 16 0M12 18l4-6",
  scout: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  pitch: "M3 5h18v14H3zM12 5v14M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 9h3v6H3M21 9h-3v6h3",
  chat: "M4 5h16v11H8l-4 4z",
  staff: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  chevron: "M6 9l6 6 6-6",
  menu: "M4 6h16M4 12h16M4 18h16",
};
export default function Icon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[name] || ""} />
    </svg>
  );
}
