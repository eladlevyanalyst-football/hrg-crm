"use client";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import FileFolder from "@/components/FileFolder";
import { LIBRARY_CATEGORIES } from "@/lib/labels";

export default function Library() {
  const [n, setN] = useState(0);
  return (
    <div className="space-y-4">
      <PageHeader title="ספריית וידאו" sub={`תוכן שלא שייך למשחק אחד: דוגמאות מהעולם, אנימציות כלליות ווידאו אישי · ${n} קבצים`} />
      <FileFolder matchId={null} categories={LIBRARY_CATEGORIES} onCount={setN} />
    </div>
  );
}
