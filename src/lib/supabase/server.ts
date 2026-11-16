import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component; middleware refreshes the session
          }
        },
      },
    }
  );
}

/** Service-role client: bypasses RLS. Server only. */
export function createAdminClient() {
  return createJsClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY(),
    { auth: { persistSession: false } }
  );
}
