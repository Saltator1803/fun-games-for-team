import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Creates a Supabase server client for Server Components, Server Actions, or Route Handlers.
 */
export async function createServerClient() {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    throw new Error(config.error || "Supabase environment variables are missing.");
  }

  const cookieStore = await cookies();

  return createSSRServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component
        }
      },
    },
  });
}
