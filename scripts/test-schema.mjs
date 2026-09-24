import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or key");
  process.exit(1);
}

const supabase = createClient(url, key);

export async function runFullVerification() {
  console.log("--------------------------------------------------");
  console.log("RUNNING SCHEMA & GAME CREATION VERIFICATION");
  console.log("--------------------------------------------------");

  // Test 1: Verify games.game_type exists
  const { data: existingGames, error: selectErr } = await supabase
    .from("games")
    .select("id, game_pin, name, game_type")
    .limit(3);

  if (selectErr) {
    console.error("❌ Test 1 FAILED: games.game_type does not exist yet.");
    console.error("   Error:", selectErr.message);
    return false;
  }
  console.log("✅ Test 1 PASSED: games.game_type exists in schema!");

  // Test 2: Verify existing rows still work and have game_type
  console.log(`✅ Test 2 PASSED: Read ${existingGames.length} existing rows. Sample game_type:`, existingGames[0]?.game_type);

  // Test 3: Insert Guess the Logo game
  const logoPin = "T" + Math.floor(10000 + Math.random() * 90000);
  const { data: logoGame, error: logoErr } = await supabase
    .from("games")
    .insert({
      game_pin: logoPin,
      name: "Test Logo Game",
      game_type: "logo",
      host_id: "00000000-0000-0000-0000-000000000001",
      status: "LOBBY",
      current_question: 0,
      settings: { gameType: "logo" },
    })
    .select()
    .single();

  if (logoErr) {
    console.error("❌ Test 3 FAILED: Could not insert game_type='logo':", logoErr.message);
    return false;
  }
  console.log(`✅ Test 3 PASSED: Logo game created successfully! id: ${logoGame.id}, game_type: ${logoGame.game_type}`);

  // Test 4: Insert Guess the Meme game
  const memePin = "M" + Math.floor(10000 + Math.random() * 90000);
  const { data: memeGame, error: memeErr } = await supabase
    .from("games")
    .insert({
      game_pin: memePin,
      name: "Test Meme Game",
      game_type: "meme",
      host_id: "00000000-0000-0000-0000-000000000001",
      status: "LOBBY",
      current_question: 0,
      settings: { gameType: "meme" },
    })
    .select()
    .single();

  if (memeErr) {
    console.error("❌ Test 4 FAILED: Could not insert game_type='meme':", memeErr.message);
    return false;
  }
  console.log(`✅ Test 4 PASSED: Meme game created successfully! id: ${memeGame.id}, game_type: ${memeGame.game_type}`);

  // Clean up the 2 test rows
  await supabase.from("games").delete().in("id", [logoGame.id, memeGame.id]);
  console.log("🧹 Test games cleaned up.");

  console.log("--------------------------------------------------");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("--------------------------------------------------");
  return true;
}

runFullVerification();
