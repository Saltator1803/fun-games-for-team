import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkCols() {
  // Test video_url
  const { error: vErr } = await supabase.from("questions").select("video_url").limit(1);
  console.log("video_url check:", vErr ? vErr.message : "EXISTS");

  // Test difficulty
  const { error: dErr } = await supabase.from("questions").select("difficulty").limit(1);
  console.log("difficulty check:", dErr ? dErr.message : "EXISTS");

  // Test category
  const { error: cErr } = await supabase.from("questions").select("category").limit(1);
  console.log("category check:", cErr ? cErr.message : "EXISTS");
}

checkCols();
