import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates or retrieves a singleton Supabase browser client configured for Next.js.
 * Configured with high event throughput parameters to support 20-30+ simultaneous multiplayer players.
 */
export function createClient() {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    if (typeof window !== "undefined") {
      console.error(`[Supabase Configuration Error]: ${config.error}`);
    }
    // Return a dummy client so React renders without crashing, operations will fail predictably with descriptive error
    return createBrowserClient(
      config.url || "https://unconfigured.supabase.co",
      config.publishableKey || "unconfigured-key"
    );
  }

  if (typeof window === "undefined") {
    return createBrowserClient(config.url, config.publishableKey);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.publishableKey, {
      realtime: {
        params: {
          eventsPerSecond: 40,
        },
      },
    });
  }

  return browserClient;
}
