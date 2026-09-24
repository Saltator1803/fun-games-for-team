export interface DemoMeme {
  id?: string;
  image_url: string;
  video_url: string;
  correct_answer: string;
  alternate_answers?: string[];
  category: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit?: number;
  points?: number;
}

export const MEME_CATEGORIES = [
  "All Categories",
  "Indian Memes",
  "Bollywood",
  "Internet Memes",
  "Reaction Memes",
  "Viral Moments",
  "Sports Memes",
  "Office Memes",
  "Pop Culture",
] as const;

export const MEME_DIFFICULTIES = ["easy", "medium", "hard"] as const;

/**
 * Starter template questions for Guess the Meme.
 * Each meme links an image_url to a corresponding YouTube video_url.
 * Actual meme assets can replace these URLs anytime.
 */
export const DEMO_MEMES: DemoMeme[] = [
  {
    image_url: "/memes/meme1.png",
    video_url: "https://www.youtube.com/watch?v=MZsspTYH674",
    correct_answer: "Brother Ew (What's That?)",
    alternate_answers: [
      "Brother Ew",
      "What's that brother",
      "Whats that brother",
      "Brother Eww",
      "Ew brother ew",
      "Mohamed Hoblos",
    ],
    category: "Internet Memes",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme2.png",
    video_url: "https://www.youtube.com/shorts/uUex8ZupmfI",
    correct_answer: "Underworld Mein Jigra (Arjun Kapoor)",
    alternate_answers: [
      "Arjun Kapoor",
      "Underworld mein jigra",
      "Underworld me jigra",
      "Arjun Kapoor angry",
      "Half Girlfriend",
      "Arjun Kapoor status",
    ],
    category: "Bollywood",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme3.png",
    video_url: "https://www.youtube.com/watch?v=P571QhkD-sY",
    correct_answer: "Adat Se Gareeb (Lakshay Chaudhary)",
    alternate_answers: [
      "Lakshay Chaudhary",
      "Adat se gareeb",
      "Aadmi apni aadat se gareeb hota hai",
      "Aadat se gareeb",
      "Gareeb aadmi",
    ],
    category: "Indian Memes",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme4.png",
    video_url: "https://www.youtube.com/watch?v=Nx3bO9ogkcg",
    correct_answer: "Kyu Nahi Ho Rahi Padhai? (Alakh Pandey)",
    alternate_answers: [
      "Kyu nahi ho rahi padhai",
      "Alakh Pandey",
      "Physics Wallah",
      "Kyun nahi ho rahi padhai",
      "Padhai kyu nahi ho rahi",
      "PW",
    ],
    category: "Indian Memes",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme5.png",
    video_url: "https://www.youtube.com/watch?v=iTYrRc-Xsk4",
    correct_answer: "Emotional Damage",
    alternate_answers: [
      "Emotional Damage",
      "Steven He",
      "Emotional Damage meme",
    ],
    category: "Internet Memes",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme6.png",
    video_url: "https://www.youtube.com/watch?v=2kC-hs7lYH4",
    correct_answer: "Aap Yaha Aayenge (Farhan Akhtar & Amitabh Bachchan)",
    alternate_answers: [
      "Aap yaha aayenge",
      "Aap yaha aa jae",
      "Farhan Akhtar",
      "Amitabh Bachchan",
      "Javed Akhtar Farhan Akhtar",
      "Aap yahan aayenge",
      "Aap idhar aayenge",
    ],
    category: "Bollywood",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme7.png",
    video_url: "https://www.youtube.com/watch?v=mHRePGRmKKM",
    correct_answer: "Level Sabke Niklenge",
    alternate_answers: [
      "Level sabke niklenge",
      "Level sab ke niklenge",
      "Par niklenge uske jo khada rahega",
      "Level sabke niklenge meme",
    ],
    category: "Indian Memes",
    difficulty: "easy",
    points: 100,
  },
  {
    image_url: "/memes/meme8.png",
    video_url: "https://www.youtube.com/watch?v=cNwLovx3dj0",
    correct_answer: "Money Follows My Brother (Ravi Kishan)",
    alternate_answers: [
      "Money follows",
      "Money follows my brother",
      "Ravi Kishan",
      "Ravi Kishan money follows",
      "Money follows you",
    ],
    category: "Bollywood",
    difficulty: "easy",
    points: 100,
  },
];
