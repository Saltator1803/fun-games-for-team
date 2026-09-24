import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

const gameId = "b2c80559-b860-4dde-a6b9-3a8866976e1f";

const DEMO_MEME_1 = {
  game_id: gameId,
  order_number: 1,
  image_url: "/memes/confused_nick_young.jpg",
  video_url: "/memes/confused_nick_young.mp4",
  correct_answer: "Confused Nick Young",
  alternate_answers: [
    "Nick Young Confused",
    "Confused Nick Young Meme",
    "Nick Young",
    "Confused Guy",
    "Swaggy P",
  ],
  category: "Reaction Memes",
  difficulty: "easy",
  points: 100,
  time_limit: 10,
};

async function testInsert() {
  console.log("Attempting to insert exact meme question into questions table...");
  console.log("Sample question payload:", JSON.stringify(DEMO_MEME_1, null, 2));

  const { data, error } = await supabase
    .from("questions")
    .insert([DEMO_MEME_1])
    .select();

  if (error) {
    console.error("EXACT SUPABASE ERROR:");
    console.error("error.message:", error.message);
    console.error("error.code:", error.code);
    console.error("error.details:", error.details);
    console.error("error.hint:", error.hint);
    console.error("full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  } else {
    console.log("SUCCESS! Question inserted:", data);
  }

  // Also inspect what columns questions table actually has by querying an existing logo question
  console.log("\nInspecting existing questions table schema:");
  const { data: existingQ, error: qErr } = await supabase
    .from("questions")
    .select("*")
    .limit(1);

  if (qErr) {
    console.error("Error inspecting existing questions:", qErr);
  } else if (existingQ && existingQ.length > 0) {
    console.log("Columns present on existing questions row:", Object.keys(existingQ[0]));
    console.log("Sample existing question row:", existingQ[0]);
  } else {
    console.log("No existing rows found in questions table.");
  }
}

testInsert();
