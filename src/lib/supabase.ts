import { createClient } from "./supabase/client";

export * from "./supabase/config";
export * from "./supabase/client";

// Default client instance for client components
export const supabase = createClient();
