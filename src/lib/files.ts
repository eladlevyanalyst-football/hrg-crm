import type { SupabaseClient } from "@supabase/supabase-js";

/** Upload a browser File to the private 'files' bucket; returns storage path. */
export async function uploadFile(sb: SupabaseClient, file: File, folder: string) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${Date.now()}_${safe}`;
  const { error } = await sb.storage.from("files").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/** Open a stored file (signed URL) or an external link in a new tab. */
export async function openFile(sb: SupabaseClient, f: { storage_path: string | null; external_url?: string | null }) {
  if (f.external_url) return window.open(f.external_url, "_blank");
  if (!f.storage_path) return;
  const w = window.open("", "_blank");
  const { data } = await sb.storage.from("files").createSignedUrl(f.storage_path, 60 * 60);
  if (data?.signedUrl && w) w.location.href = data.signedUrl;
}
