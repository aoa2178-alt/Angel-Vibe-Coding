export type SlangCategory = "everyday" | "food" | "streets" | "classics";

export const SLANG_CATEGORIES: { id: SlangCategory; label: string; emoji: string }[] = [
  { id: "everyday", label: "Everyday Talk", emoji: "💬" },
  { id: "food", label: "Food & Deli", emoji: "🥪" },
  { id: "streets", label: "Subway & Streets", emoji: "🚇" },
  { id: "classics", label: "NYC Classics", emoji: "🗽" },
];

export type SlangTerm = {
  id: string;
  term: string;
  phonetic: string;
  category: SlangCategory;
  short: string;
  definition: string;
  example: string;
  warning: string;
  /** 1 = safe for anyone, 5 = you will sound like a tryhard */
  cringe: number;
  quiz: { prompt: string; options: string[]; answer: number };
};

export const SLANG: SlangTerm[] = [
  {
    id: "deadass",
    term: "Deadass",
    phonetic: "/ˈded.æs/",
    category: "everyday",
    short: "Seriously / I'm not joking",
    definition:
      "An intensifier meaning completely serious. Works as a statement ('I'm deadass'), an adverb ('I deadass waited an hour'), or a one-word question of disbelief ('Deadass?').",
    example: "“I deadass waited 40 minutes for the G.” “Deadass?” “Deadass.”",
    warning:
      "Born in Black and Latino NYC, mainstreamed by teens. Fine in casual talk, instantly cringe in a work email or if you over-lean on it. One per conversation, not one per sentence.",
    cringe: 3,
    quiz: {
      prompt: "Someone says “I'm deadass.” What do they mean?",
      options: ["They're exhausted", "They're completely serious", "They're broke", "They're leaving"],
      answer: 1,
    },
  },
  {
    id: "brick",
    term: "Brick",
    phonetic: "/brɪk/",
    category: "everyday",
    short: "Bitterly, painfully cold",
    definition:
      "Cold enough to hurt. Used only about weather, almost always with 'out' — 'it's brick out.' Nothing to do with bricks.",
    example: "“Bro, it is brick out — wear your bubble jacket.”",
    warning:
      "Very safe to use, very NYC. Just don't say it in October when it's 55 degrees; that marks you as new.",
    cringe: 1,
    quiz: {
      prompt: "“It's brick out” means…",
      options: ["It's freezing", "The streets are torn up", "It's humid", "Traffic is bad"],
      answer: 0,
    },
  },
  {
    id: "mad",
    term: "Mad",
    phonetic: "/mæd/",
    category: "everyday",
    short: "Very / a lot of",
    definition:
      "Quantifier meaning 'a lot' or 'extremely.' 'Mad people' = a crowd. 'Mad tired' = exhausted. Anger is not implied.",
    example: "“There were mad people on the platform, so I walked.”",
    warning:
      "The most naturally usable NYC word on this list — locals of every age say it. Low risk, high payoff.",
    cringe: 1,
    quiz: {
      prompt: "“There were mad people at the bar” means there were…",
      options: ["Angry people", "A lot of people", "Rude people", "Only regulars"],
      answer: 1,
    },
  },
  {
    id: "facts",
    term: "Facts / No Cap",
    phonetic: "/fækts/ · /noʊ kæp/",
    category: "everyday",
    short: "Agreed / no lie",
    definition:
      "'Facts' is a full-sentence agreement — the NYC version of 'exactly.' 'No cap' means no exaggeration; 'cappin'' means lying.",
    example: "“The 4 train is the worst line, no cap.” “Facts.”",
    warning:
      "Both are broadly American now, so they read young rather than local. Say 'facts' as a standalone reply; stringing several slang words together is where it turns into a costume.",
    cringe: 3,
    quiz: {
      prompt: "Replying just “Facts.” to a friend means…",
      options: ["Prove it", "You totally agree", "You're changing subject", "You're annoyed"],
      answer: 1,
    },
  },
  {
    id: "thecity",
    term: "The City",
    phonetic: "/ðə ˈsɪ.ti/",
    category: "classics",
    short: "Manhattan — never say “Manhattan”",
    definition:
      "In everyday NYC speech, 'the city' means Manhattan, even though all five boroughs are the city. People in Brooklyn or Queens say they're 'going into the city.'",
    example: "“You coming out?” “Yeah, heading into the city around eight.”",
    warning:
      "The tell of a newcomer is saying 'I'm going to Manhattan.' Say 'the city' and, better still, name the neighborhood — 'I'm going to the Lower East Side.'",
    cringe: 1,
    quiz: {
      prompt: "A friend in Astoria says “I'm going into the city.” Where are they going?",
      options: ["Downtown Brooklyn", "Manhattan", "Anywhere in the five boroughs", "Jersey City"],
      answer: 1,
    },
  },
  {
    id: "schlep",
    term: "Schlep",
    phonetic: "/ʃlɛp/",
    category: "streets",
    short: "A long annoying haul (verb or noun)",
    definition:
      "From Yiddish. To drag yourself or your stuff a tiring distance — or the trip itself. 'That's a schlep' = it's far and irritating.",
    example: "“Bushwick to Inwood on a Sunday? That's a schlep.”",
    warning:
      "Zero cringe risk; it's plain New York English across every age and background. Pronounce it 'shlep,' not 'sklep.'",
    cringe: 1,
    quiz: {
      prompt: "“It's a schlep” tells you the trip is…",
      options: ["Expensive", "Long and tiring", "Scenic", "Unsafe"],
      answer: 1,
    },
  },
  {
    id: "yerrr",
    term: "Yerrr",
    phonetic: "/jɜːr/ (hold the r)",
    category: "streets",
    short: "Hey! / hello / I'm here",
    definition:
      "A shouted greeting and general call across a street, platform, or apartment building. Rising tone means 'where you at?'; flat tone is just hello.",
    example: "“YERRR!” “Yerrr, I'm outside, come down.”",
    warning:
      "Highest tryhard risk here. It's a real greeting between people who know each other, mostly in the Bronx, Harlem and Brooklyn. Recognize it; don't debut it in month one.",
    cringe: 5,
    quiz: {
      prompt: "Someone yells “Yerrr!” from across the street. It's…",
      options: ["An insult", "A greeting", "A warning", "A cab hail"],
      answer: 1,
    },
  },
  {
    id: "regular",
    term: "Regular Coffee",
    phonetic: "/ˈrɛɡ.jə.lər/",
    category: "food",
    short: "Milk and two sugars",
    definition:
      "At a bodega, deli or cart, 'regular' is not black coffee — it's coffee with milk and two sugars, poured into the blue Greek cup without asking.",
    example: "“Lemme get a bacon egg and cheese and a regular.”",
    warning:
      "Safe and useful. But if you want it black, say 'black, no sugar' — asking for 'regular' and then complaining holds up the line.",
    cringe: 1,
    quiz: {
      prompt: "You order a “regular coffee” at a deli. You get…",
      options: ["Black coffee", "Milk and two sugars", "Medium size, your choice", "Decaf"],
      answer: 1,
    },
  },
  {
    id: "pie",
    term: "Pie",
    phonetic: "/paɪ/",
    category: "food",
    short: "A whole pizza",
    definition:
      "A whole pizza is a pie; one slice is 'a slice' or 'a regular slice.' Ordering 'a pizza' when you want one slice will get you a whole one.",
    example: "“Two regular slices.” “…and a pie to go for the party.”",
    warning:
      "Totally standard — say it. Just never say 'a pie of pizza,' and never fold a slice in a way you have to think about.",
    cringe: 1,
    quiz: {
      prompt: "You ask for “a pie.” You're getting…",
      options: ["One slice", "A whole pizza", "Dessert", "A calzone"],
      answer: 1,
    },
  },
  {
    id: "grill",
    term: "Grill",
    phonetic: "/ɡrɪl/",
    category: "streets",
    short: "To stare someone down",
    definition:
      "To stare hard at someone, usually with attitude. 'Why is he grilling me?' Separately, 'a grill' is the deli flat-top your bacon egg and cheese comes off.",
    example: "“That dude was grilling me the whole ride from Union Square.”",
    warning:
      "Fine to use, but the real rule is behavioral: don't grill anyone. Sustained eye contact on the subway is the fastest way to start something.",
    cringe: 2,
    quiz: {
      prompt: "“He was grilling me on the train” means he was…",
      options: ["Questioning me", "Staring me down", "Cooking", "Asking for money"],
      answer: 1,
    },
  },
  {
    id: "bec",
    term: "BEC",
    phonetic: "/ˌbiː.iːˈsiː/",
    category: "food",
    short: "Bacon, egg and cheese",
    definition:
      "The bodega breakfast sandwich. Ordered fast, on a roll unless you say otherwise, with salt-pepper-ketchup as one word.",
    example: "“BEC on a roll, salt pepper ketchup, and a regular.”",
    warning:
      "Say the whole phrase in one breath and have your card ready. Hesitating is the only real mistake.",
    cringe: 1,
    quiz: {
      prompt: "“SPK” on your BEC means…",
      options: [
        "Sausage, pepper, kale",
        "Salt, pepper, ketchup",
        "Spicy pepper kick",
        "Small portion, kids",
      ],
      answer: 1,
    },
  },
  {
    id: "outerboro",
    term: "OD / Odee",
    phonetic: "/oʊˈdiː/",
    category: "everyday",
    short: "Excessively, way too much",
    definition:
      "From 'overdose.' Means over the top: 'that's OD' = that's excessive. Also an adverb — 'it's OD crowded.'",
    example: "“$9 for a coffee? That's OD.”",
    warning:
      "Common with younger New Yorkers, especially in the outer boroughs. Slightly more insider than 'mad' — use it once you've heard it in the wild.",
    cringe: 4,
    quiz: {
      prompt: "“That's OD” means it's…",
      options: ["Perfect", "Excessive", "Old-fashioned", "Cheap"],
      answer: 1,
    },
  },
];
