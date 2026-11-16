"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Crest from "@/components/Crest";
import Icon from "@/components/Icon";

type Item = { href: string; label: string; icon: string; children?: Item[] };
const ITEMS: Item[] = [
  { href: "/", label: "בית", icon: "home" },
  { href: "/calendar", label: "לוח שנה", icon: "calendar" },
  { href: "/tasks", label: "משימות צוות", icon: "tasks" },
  { href: "/players", label: "שחקנים", icon: "players" },
  { href: "/matches", label: "תיקי משחקים", icon: "folder" },
  { href: "/library", label: "ספריית וידאו", icon: "film" },
  {
    href: "/perf", label: "ביצועים ונתונים", icon: "pulse", children: [
      { href: "/data?source=gps", label: "נתוני GPS", icon: "gps" },
      { href: "/data?source=stats", label: "נתוני דאטה", icon: "chart" },
      { href: "/wellness?view=wellness", label: "וולבינג", icon: "heart" },
      { href: "/wellness?view=rpe", label: "RPE ועומסים", icon: "gauge" },
    ],
  },
  { href: "/scouting", label: "פינת סקאוטינג", icon: "scout" },
  { href: "/lineup", label: "מגרש הרכבים", icon: "pitch" },
  { href: "/chat", label: "צ'אט AI", icon: "chat" },
];

export default function Nav() {
  const path = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(true);

  const isActive = (href: string) => {
    const [p, q] = href.split("?");
    if (p === "/") return path === "/";
    if (!path.startsWith(p)) return false;
    if (!q) return true;
    const [k, v] = q.split("=");
    const cur = sp.get(k);
    if (p === "/data") return cur === v;
    return (cur || "wellness") === v;
  };

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const link = (i: Item, sub = false) => (
    <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
      className={`flex items-center gap-2.5 rounded px-3 ${sub ? "py-1.5 text-[13px]" : "py-2 text-sm"} ${isActive(i.href) ? "bg-white font-semibold text-ink [&_svg]:text-brand" : "text-gray-300 hover:bg-ink-3 hover:text-white"}`}>
      <Icon name={i.icon} size={sub ? 14 : 16} />{i.label}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-2.5 text-white md:hidden">
        <div className="flex items-center gap-2"><Crest size={26} /><span className="font-display text-lg font-bold">הפועל רמת גן</span></div>
        <button onClick={() => setOpen(!open)} aria-label="תפריט"><Icon name="menu" size={24} /></button>
      </header>
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 right-0 z-30 w-60 flex-col bg-ink pt-12 text-white md:sticky md:top-0 md:flex md:h-screen md:pt-0`}>
        <div className="flex items-center gap-3 px-4 py-5">
          <Crest size={38} />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold">הפועל רמת גן</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Performance Hub · 26/27</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {ITEMS.map((i) => i.children ? (
            <div key={i.href}>
              <button onClick={() => setPerfOpen(!perfOpen)} className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm text-gray-300 hover:bg-ink-3 hover:text-white">
                <Icon name={i.icon} />{i.label}<Icon name="chevron" size={14} className={`mr-auto transition ${perfOpen ? "rotate-180" : ""}`} />
              </button>
              {perfOpen && <div className="mr-3 space-y-0.5 border-r border-ink-3 pr-2">{i.children.map((c) => link(c, true))}</div>}
            </div>
          ) : link(i))}
        </nav>
        <div className="border-t border-ink-3 px-3 py-3">
          {link({ href: "/staff", label: "אנשי צוות", icon: "staff" })}
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm text-gray-400 hover:bg-ink-3 hover:text-white"><Icon name="logout" />התנתקות</button>
          <div className="px-3 pt-2 text-[10px] leading-tight text-gray-500">המחלקה המקצועית<br />עונת 2026/27</div>
        </div>
      </aside>
    </>
  );
}
