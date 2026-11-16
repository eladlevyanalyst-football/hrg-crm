"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player, Profile } from "@/lib/types";

export function useSupabase() {
  return useMemo(() => createClient(), []);
}

/** Load all rows of a table (with optional order), plus a reload function. */
export function useTable<T>(table: string, order = "created_at", ascending = false, filter?: (q: any) => any) {
  const sb = useSupabase();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    let q = sb.from(table).select("*").order(order, { ascending });
    if (filter) q = filter(q);
    const { data } = await q;
    setRows((data as T[]) || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, table, order, ascending]);
  useEffect(() => { reload(); }, [reload]);
  return { rows, setRows, loading, reload, sb };
}

export function usePlayers() {
  return useTable<Player>("players", "shirt_number", true);
}
export function useStaff() {
  return useTable<Profile>("profiles", "full_name", true);
}

export function useMe() {
  const sb = useSupabase();
  const [me, setMe] = useState<Profile | null>(null);
  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await sb.from("profiles").select("*").eq("id", data.user.id).single();
      setMe((p as Profile) || { id: data.user.id, full_name: data.user.email || "", role: "staff", job_title: "" });
    });
  }, [sb]);
  return me;
}
