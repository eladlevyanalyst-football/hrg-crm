"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/", label: "ראשי", icon: "🏠" },
  { href: "/calendar", label: "לוח שנה", icon: "📅" },
  { href: "/tasks", label: "משימות", icon: "✅" },
  { href: "/players", label: "שחקנים", icon: "👥" },
  { href: "/matches", label: "תיקי משחקים", icon: "📁" },
  { href: "/wellness", label: "וולבינג ו-RPE", icon: "💚" },
  { href: "/data", label: "נתונים ו-GPS", icon: "📊" },
  { href: "/scouting", label: "סקאוטינג", icon: "🔭" },
  { href: "/lineup", label: "מגרש הרכבים", icon: "⚽" },
  { href: "/chat", label: "צ'אט AI", icon: "🤖" },
  { href: "/staff", label: "אנשי צוות", icon: "🧑‍💼" },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[var(--brand)] px-4 py-3 text-white md:hidden">
        <span className="font-bold">HRG צוות</span>
        <button onClick={() => setOpen(!open)} className="text-2xl" aria-label="תפריט">☰</button>
      </header>
      <aside className={`${open ? "block" : "hidden"} fixed inset-y-0 right-0 z-30 w-60 overflow-y-auto bg-gray-900 pt-14 text-gray-100 md:sticky md:top-0 md:block md:h-screen md:pt-0`}>
        <div className="hidden px-5 py-5 md:block">
          <div className="text-xl font-bold">HRG <span className="text-[var(--brand)]">●</span> צוות</div>
          <div className="text-xs text-gray-400">הצוות המקצועי</div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 pb-4">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active(i.href) ? "bg-[var(--brand)] text-white" : "hover:bg-gray-800"}`}>
              <span>{i.icon}</span>{i.label}
            </Link>
          ))}
          <button onClick={logout} className="mt-4 rounded-lg px-3 py-2 text-right text-sm text-gray-400 hover:bg-gray-800">↩ התנתקות</button>
        </nav>
      </aside>
    </>
  );
}
