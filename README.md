# HRG צוות – אתר הצוות המקצועי

אתר אחד לכל עבודת הצוות: שחקנים, לוח שנה, משימות, תיקי משחקים, וולבינג ו-RPE, נתוני GPS ו-Opta, סקאוטינג, מגרש הרכבים וצ'אט AI.

**טכנולוגיה:** Next.js (האתר), Supabase (מסד נתונים, התחברות וקבצים), Vercel (אירוח).

## העלאה לאוויר (פעם אחת)

1. **Vercel:** נכנסים ל-vercel.com עם "Continue with GitHub", לוחצים Add New → Project ובוחרים את הריפו הזה. לוחצים Deploy (הפריסה הראשונה תיכשל, זה צפוי).
2. **Supabase דרך Vercel:** בפרויקט ב-Vercel → Storage → Create Database → Supabase. זה פותח פרויקט Supabase ומכניס את כל המפתחות לבד.
3. **משתנים נוספים** ב-Vercel → Settings → Environment Variables:
   - `FORM_CODE` – קוד שהשחקנים מקלידים בטופס (למשל 4 ספרות).
   - `ANTHROPIC_API_KEY` – מפתח לצ'אט ה-AI (מ-console.anthropic.com). לא חובה בשלב הראשון.
4. **Redeploy** (Deployments → ⋯ → Redeploy).
5. נכנסים לכתובת האתר + `/setup` ויוצרים את המנהל הראשון. הטבלאות נוצרות אוטומטית בשלב הזה.
6. מוסיפים את שאר הצוות מעמוד "אנשי צוות".

אם הטבלאות לא נוצרו אוטומטית: Supabase → SQL Editor → מדביקים את `supabase/schema.sql` → Run.

## משתני סביבה

| משתנה | מאיפה |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL_NON_POOLING` | נוצרים אוטומטית בחיבור Supabase ב-Vercel |
| `FORM_CODE` | בוחרים לבד |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

## הערות
- קבצי וידאו גדולים (משחק מלא) עדיף להוסיף כקישור (Drive, Wyscout, YouTube). בתוכנית החינמית של Supabase הגבלת קובץ היא 50MB.
- ייבוא נתונים: CSV או Excel שמייצאים מ-K-Sport, Opta, TruMedia או Wyscout.
- טופס השחקנים: `/form`. שולחים את הקישור בקבוצת הווטסאפ.

## פיתוח מקומי
```
cp .env.example .env.local   # למלא ערכים
npm install
npm run dev
```
