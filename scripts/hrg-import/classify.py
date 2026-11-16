#!/usr/bin/env python3
"""Map every file in elad's HRG folder to a site match + folder category.

Input : manifest TSV  "<bytes>\t./<relative path>"  (find HRG -type f -printf '%s\t%p\n')
Output: plan TSV       match_key, category, kind, action, mb, title, path, note
        (kind = ours | opponent | ""   for full matches)
        (action = upload | link | skip | dup)

Usage: python3 classify.py manifest.tsv > plan.tsv
"""
import re
import sys
from collections import Counter

# Site matches to create. key -> (opponent, competition, round, note)
MATCHES = {
    "L-HTA":   ("הפועל תל אביב", "ליגת העל", "3", ""),
    "L-FCMN":  ("מכבי נתניה", "ליגת העל", "4", ""),
    "L-SAKH":  ("בני סכנין", "ליגת העל", "5", ""),
    "L-BJ":    ('בית"ר ירושלים', "ליגת העל", "", "דוח יריבה מ-11.10.2026"),
    "L-MPT":   ("מכבי פתח תקווה", "ליגת העל", "8", ""),
    "L-HPT":   ("הפועל פתח תקווה", "ליגת העל", "10", ""),
    "L-HBS":   ("הפועל באר שבע", "ליגת העל", "", ""),
    "L-HAIFA": ("הפועל חיפה", "ליגת העל", "", ""),
    "T-BJ":    ('בית"ר ירושלים', "גביע הטוטו", "", ""),
    "T-MN":    ("מכבי נתניה", "גביע הטוטו", "", ""),
    "T-HJ":    ("הפועל ירושלים", "גביע הטוטו", "4", ""),
    "T-MPT":   ("מכבי פתח תקווה", "גביע הטוטו", "5", ""),
    "T-HPT":   ("הפועל פתח תקווה", "גביע הטוטו", "", ""),
    "F-TOPOLA": ("באצ'קה טופולה", "משחק הכנה", "", ""),
    "F-MTA":   ("מכבי תל אביב", "משחק אימון", "", ""),
}

FOLDER_MATCH = {
    "תיקי משחק/BEITAR JERUSALEM/": "L-BJ",
    "תיקי משחק/BNEI SAKHNIN/": "L-SAKH",
    "תיקי משחק/FCMN/": "L-FCMN",
    "תיקי משחק/HAPOEL HAIFA/": "L-HAIFA",
    "תיקי משחק/HAPOEL PETACH TIKVA/": "L-HPT",
    "תיקי משחק/HBS/": "L-HBS",
    "תיקי משחק/HTA/": "L-HTA",
    "תיקי משחק/MACCABI PETACH TIKVA/": "L-MPT",
    "תיקי משחק/TOTO CUP/BEITAR JERUSALEM/": "T-BJ",
    "תיקי משחק/TOTO CUP/HAPOEL JERUSALEM/": "T-HJ",
    "תיקי משחק/TOTO CUP/HAPOEL PETACH TIKVA/": "T-HPT",
    "תיקי משחק/TOTO CUP/MACCABI NETANYA/": "T-MN",
}

# Library (no match) sections, by top-level folder
LIBRARY = {
    "תוכן מהעולם/": "תוכן מהעולם",
    "אלכס/": "אנימציות כלליות",
    "אנימציות/": "אנימציות כלליות",
    "וידאו אישי": "וידאו אישי - שחקני הקבוצה",
    "וידאו לואן ומריוס": "וידאו אישי - שחקני הקבוצה",
    "וידאו/": "וידאו כללי",
}

UPLOAD_LIMIT_MB = 50  # Supabase free tier per-file limit


def has(s, *words):
    s = s.lower()
    return any(w.lower() in s for w in words)


def title_of(name):
    t = re.sub(r"\.[^.]+$", "", name)
    t = re.sub(r"^fmstadio_", "", t)
    t = t.replace("עותק של ", "").replace("_", " ").strip()
    return re.sub(r"\s+", " ", t)


def classify(path):
    """Return (match_key or LIB:<section> or None, category, kind, action, note)."""
    name = path.rsplit("/", 1)[-1]
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

    # Things that are not content
    if name == "Icon" or ext == "wfp":
        return None, "", "", "skip", "קובץ מערכת / פרויקט עריכה"
    if path.startswith("אלעד אישי/"):
        return None, "", "", "skip", "אישי (קורות חיים) - לא עולה לאתר"
    if path.startswith("RG slides/") or has(name, "logo", "סמל"):
        return None, "", "", "skip", "סמל / רקע - משמש לעיצוב האתר"
    if ext == "zip":
        return None, "", "", "skip", "כפילות מכווצת של תיקייה/קובץ קיים"

    # Which match
    key = None
    for prefix, k in FOLDER_MATCH.items():
        if path.startswith(prefix):
            key = k
            break
    note = ""
    if has(path, "league 5 - bnei sakhnin - hapoel ramat gan"):
        key, note = "L-SAKH", "הועבר מתיקיית מכבי פ\"ת (משחק שלנו מול סכנין)"
    elif has(path, "טוטו 5"):
        key, note = "T-MPT", "הועבר מתיקיית מכבי פ\"ת (משחק טוטו 5)"
    elif has(name, "pre match hrg vs hapoel haifa"):
        key, note = "L-HAIFA", "הועבר מדוחות מכבי פ\"ת"
    elif has(path, "BACHKA TOPOLA", "באצקה טופולה") and not path.startswith("תיקי משחק/"):
        key = "F-TOPOLA"
    elif has(path, "Training - Maccabi Tel Aviv"):
        key = "F-MTA"

    if key is None:
        for prefix, section in LIBRARY.items():
            if path.startswith(prefix):
                key = "LIB:" + section
                break
    if key is None:
        key = "LIB:וידאו כללי"

    # Copies of library clips inside a match folder: link, don't upload twice
    if "דוגמאות מהעולם" in path:
        return key, "ideas", "", "dup", "עותק של קליפ מ'תוכן מהעולם' - יקושר לעותק שבספרייה"

    # Category
    kind = ""
    if "משחקים מלאים" in path or re.search(r"\bfull\b(?! backs)", name, re.I) or has(name, "AC.Analyst"):
        cat = "full"
        ours = ("משחקים מלאים" not in path) or has(path, "hapoel ramat gan", 'הפועל ר״ג')
        kind = "ours" if ours else "opponent"
    elif has(path, "post match"):
        cat = "post"
    elif "/דוחות" in path:
        cat = "reports"
    elif has(path, "pre match"):
        cat = "pre"
    elif has(path, "נייחים", "set piece"):
        cat = "setpieces"
    elif has(path, "/אישיים/", "/אישי שחקנים/") or key.startswith("LIB:וידאו אישי"):
        cat = "individual"
    elif has(name, "הרכב", "line up"):
        cat = "pre"
        note = note or "הרכב משוער"
    elif has(path, "רעיונות", "idia", "idea", "עמידה בבלוק"):
        cat = "ideas"
    elif has(path, "אנימציות", "fmstadio") or key == "LIB:אנימציות כלליות":
        cat = "animations"
    elif has(path, "חלוקת קטעי וידאו", "ON THE BALL", "OFF THE BALL", "attack", "defence",
             "tr 2", "build up", "בילד אפ", "zone"):
        cat = "clips"
    elif has(name, "לחץ גבוה"):
        cat = "animations"
    else:
        cat = "other"
    if key == "LIB:תוכן מהעולם":
        cat = "world"
    return key, cat, kind, "upload", note


def main():
    rows = []
    seen = Counter()
    for line in open(sys.argv[1], encoding="utf-8"):
        size, path = line.rstrip("\n").split("\t", 1)
        path = path[2:] if path.startswith("./") else path
        rows.append((int(size), path))
        seen[(path.rsplit("/", 1)[-1], int(size))] += 1

    print("match_key\tcategory\tkind\taction\tmb\ttitle\tpath\tnote")
    for size, path in sorted(rows, key=lambda r: r[1]):
        key, cat, kind, action, note = classify(path)
        mb = size / 1048576
        if action == "upload" and kind == "opponent":
            action = "link"
            note = note or "משחק מלא של היריבה - מומלץ קישור (Wyscout / דרייב)"
        print("\t".join([key or "", cat, kind, action, f"{mb:.1f}",
                         title_of(path.rsplit('/', 1)[-1]), path, note]))


if __name__ == "__main__":
    main()
