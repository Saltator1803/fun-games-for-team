import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select("id, image_url, video_url, category, difficulty")
    .limit(1);

  if (error) {
    console.log("questions check error:", error.code, error.message);
  } else {
    console.log("questions columns video_url/category/difficulty exist!");
  }
}

checkQuestions();
