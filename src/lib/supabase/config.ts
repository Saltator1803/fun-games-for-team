/**
 * Supabase configuration module.
 * Loads and validates environment variables without hardcoding any credentials.
 */

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
  error?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!url || !publishableKey) {
    return {
      url: "",
      publishableKey: "",
      isConfigured: false,
      error:
        "Supabase environment variables are missing. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file.",
    };
  }

  // Prevent placeholder or invalid dummy values from causing subtle issues
  if (url.includes("dummy.supabase.co") || publishableKey.includes("dummy_key")) {
    return {
      url,
      publishableKey,
      isConfigured: false,
      error:
        "Supabase credentials are using placeholder values. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local with your real project credentials.",
    };
  }

  return {
    url,
    publishableKey,
    isConfigured: true,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function getSupabaseErrorMessage(): string | null {
  const config = getSupabaseConfig();
  return config.isConfigured ? null : (config.error ?? "Supabase is not configured.");
}
