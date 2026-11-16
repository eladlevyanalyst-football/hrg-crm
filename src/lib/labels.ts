export const FILE_CATEGORIES: Record<string, string> = {
  pre: "פרי מאטצ'",
  post: "פוסט מאטצ'",
  animations: "אנימציות",
  full: "משחק מלא",
  reports: "דוחות",
  individual: "וידאו אישי",
  other: "אחר",
};
export const EVENT_KINDS: Record<string, { label: string; color: string }> = {
  training: { label: "אימון", color: "bg-green-100 text-green-800" },
  match: { label: "משחק", color: "bg-red-100 text-red-800" },
  gym: { label: "חדר כושר", color: "bg-orange-100 text-orange-800" },
  meeting: { label: "פגישה", color: "bg-blue-100 text-blue-800" },
  travel: { label: "נסיעה", color: "bg-purple-100 text-purple-800" },
  other: { label: "אחר", color: "bg-gray-100 text-gray-800" },
};
export const TASK_STATUS: Record<string, string> = { todo: "לביצוע", doing: "בעבודה", done: "בוצע" };
export const PRIORITY: Record<string, { label: string; color: string }> = {
  low: { label: "נמוכה", color: "bg-gray-100 text-gray-700" },
  normal: { label: "רגילה", color: "bg-blue-100 text-blue-800" },
  high: { label: "דחוף", color: "bg-red-100 text-red-800" },
};
export const SCOUT_STATUS: Record<string, { label: string; color: string }> = {
  watching: { label: "במעקב", color: "bg-gray-100 text-gray-700" },
  priority: { label: "עדיפות", color: "bg-yellow-100 text-yellow-800" },
  contacted: { label: "בפנייה", color: "bg-blue-100 text-blue-800" },
  rejected: { label: "נפסל", color: "bg-red-100 text-red-700" },
  signed: { label: "הוחתם", color: "bg-green-100 text-green-800" },
};
export const DATA_SOURCES: Record<string, string> = {
  gps: "GPS (K-Sport)",
  opta: "Opta",
  trumedia: "TruMedia",
  wyscout: "Wyscout",
  other: "אחר",
};
export const POSITIONS = ["שוער", "בלם", "מגן ימני", "מגן שמאלי", "קשר אחורי", "קשר", "קשר התקפי", "כנף ימין", "כנף שמאל", "חלוץ"];
export const SESSION_TYPES: Record<string, string> = { training: "אימון", match: "משחק", gym: "חדר כושר", other: "אחר" };

export function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
export function fmtTime(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}
export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function age(birth: string | null) {
  if (!birth) return null;
  const b = new Date(birth), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
}
/** Wellness total: 5 items on 1-5 scale -> percentage (higher is better). */
export function wellnessScore(w: { sleep_quality: number | null; fatigue: number | null; soreness: number | null; stress: number | null; mood: number | null }) {
  const v = [w.sleep_quality, w.fatigue, w.soreness, w.stress, w.mood].filter((x): x is number => x != null);
  if (!v.length) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / (v.length * 5)) * 100);
}
export function scoreColor(s: number | null) {
  if (s == null) return "bg-gray-100 text-gray-500";
  if (s >= 75) return "bg-green-100 text-green-800";
  if (s >= 55) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}
