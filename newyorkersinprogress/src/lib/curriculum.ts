export type Question = {
  prompt: string;
  context?: string;
  options: string[];
  answer: number;
  explain: string;
};

export type Lesson = {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  minutes: number;
  xp: number;
  questions: Question[];
};

export const CITY = "New York City";

export const LESSONS: Lesson[] = [
  {
    id: "omny",
    title: "OMNY & Subway Rules",
    blurb: "Tapping in, letting riders off, and where not to stand.",
    emoji: "🚇",
    minutes: 3,
    xp: 30,
    questions: [
      {
        prompt: "You reach the turnstile with your phone. What's the OMNY move?",
        context: "14 St–Union Square, 8:42am",
        options: [
          "Tap your phone or contactless card on the OMNY reader",
          "Buy a paper MetroCard from the booth each ride",
          "Scan a QR code on the turnstile",
        ],
        answer: 0,
        explain:
          "OMNY takes a tap from a contactless card, phone or watch. Tap the same card all week and fares cap after 12 rides.",
      },
      {
        prompt: "The doors open at your stop and people are waiting on the platform.",
        options: [
          "Step aside and let riders off before boarding",
          "Squeeze on immediately to claim a seat",
          "Stand in the doorway until it's clear",
        ],
        answer: 0,
        explain:
          "Off before on. Blocking the doors is the fastest way to earn a whole car's worth of sighs.",
      },
      {
        prompt: "Car is packed and your backpack is enormous. Where does it go?",
        options: ["On the empty seat beside you", "Off your back, down by your feet", "Stays on your back"],
        answer: 1,
        explain:
          "Bags come off your back in a crowded car, and a seat is for a person. This is the etiquette New Yorkers notice most.",
      },
      {
        prompt: "Your train is running local when you needed the express. Best move?",
        options: [
          "Ride it out and hope",
          "Cross the platform at the next express stop",
          "Exit and take a cab",
        ],
        answer: 1,
        explain:
          "Most express stops share a platform with the local, so switching is one step across. Check the map by the door.",
      },
    ],
  },
  {
    id: "cadence",
    title: "Sidewalk Cadence",
    blurb: "Walk fast, pull over to stop, never block the corner.",
    emoji: "🚶",
    minutes: 2,
    xp: 25,
    questions: [
      {
        prompt: "You need to check your phone mid-block on a busy sidewalk.",
        options: [
          "Stop where you are",
          "Step to the building side, out of the flow",
          "Slow down but keep drifting",
        ],
        answer: 1,
        explain:
          "The sidewalk is a road. Pull over to the curb or building line before stopping — abrupt stops cause pileups.",
      },
      {
        prompt: "Walking three-across with friends and someone is coming the other way.",
        options: ["Hold the line", "Drop to single file briefly", "Split around them"],
        answer: 1,
        explain:
          "Three-across is fine on a quiet block, but collapse to a narrower line when traffic comes. Nobody should step into the street.",
      },
      {
        prompt: "Light says DON'T WALK, no cars are coming, and the crowd steps out.",
        options: [
          "Standard NYC crossing — look both ways and go",
          "Illegal and heavily fined",
          "Only tourists do this",
        ],
        answer: 0,
        explain:
          "Jaywalking was decriminalized in NYC in 2024. Locals cross on the gap, not on the signal — but they always look for turning cars and cyclists.",
      },
    ],
  },
  {
    id: "bodega",
    title: "Bodega Culture",
    blurb: "The counter, the cat, and the correct way to order.",
    emoji: "🥪",
    minutes: 3,
    xp: 30,
    questions: [
      {
        prompt: "Your first order at the grill counter. What do you say?",
        options: [
          "'Bacon egg and cheese on a roll, salt pepper ketchup'",
          "'Could I please see a menu of your breakfast sandwiches?'",
          "'Whatever you recommend'",
        ],
        answer: 0,
        explain:
          "The BEC is one phrase, said in order: protein, bread, condiments. Say it clean, step aside, wait for your name.",
      },
      {
        prompt: "There's a cat asleep on the chip display.",
        options: ["Report it", "That's the bodega cat — leave it be", "Feed it your sandwich"],
        answer: 1,
        explain:
          "The bodega cat is beloved institution and unofficial pest control. Admire, don't disturb.",
      },
      {
        prompt: "Your total is $6.75 and you only have a card.",
        options: [
          "Card is always fine",
          "Check the sign — many bodegas have a card minimum",
          "Ask them to break a bill",
        ],
        answer: 1,
        explain:
          "Card minimums around $10 are common. Keep a few singles for bodegas, laundromats and the occasional cash-only slice.",
      },
    ],
  },
  {
    id: "bagel",
    title: "Ordering a Bagel & Coffee",
    blurb: "Line discipline, correct terms, and 'regular' coffee.",
    emoji: "🥯",
    minutes: 2,
    xp: 25,
    questions: [
      {
        prompt: "You ask for a 'regular coffee' at a deli. You get…",
        options: ["Black coffee", "Coffee with milk and sugar", "Decaf"],
        answer: 1,
        explain:
          "'Regular' means milk and sugar already in it. Want it plain? Say 'black, no sugar'.",
      },
      {
        prompt: "Best way to order at a busy bagel counter on a Sunday?",
        options: [
          "Decide in line, then say the whole order in one breath",
          "Ask what's freshest, then decide",
          "Wait to be greeted first",
        ],
        answer: 0,
        explain:
          "'Everything, scallion cream cheese, toasted' — one line, no hesitation. The queue behind you is the real grading rubric.",
      },
      {
        prompt: "A local orders a 'schmear'. That's…",
        options: ["A spread of cream cheese", "A double espresso", "A bagel sliced thin"],
        answer: 0,
        explain: "A schmear is your cream cheese layer. Ask for light schmear if you don't want an inch of it.",
      },
    ],
  },
  {
    id: "grid",
    title: "Street Navigation",
    blurb: "Avenues, streets, uptown vs. downtown, and address math.",
    emoji: "🧭",
    minutes: 3,
    xp: 35,
    questions: [
      {
        prompt: "In Manhattan, which way do the avenues run?",
        options: ["East–west", "North–south", "Diagonally"],
        answer: 1,
        explain:
          "Avenues run north–south (the long way), streets run east–west and cross them. Learn this and the whole island unlocks.",
      },
      {
        prompt: "You're at 23rd St and need 42nd St. You're heading…",
        options: ["Uptown", "Downtown", "Crosstown"],
        answer: 0,
        explain: "Numbers rising = uptown, falling = downtown. Moving east or west is crosstown.",
      },
      {
        prompt: "'Meet me at 5th and 48th, southwest corner.' Why the corner?",
        options: [
          "Four corners, and crossing a NYC avenue takes real time",
          "It's just a formality",
          "Corners have street numbers",
        ],
        answer: 0,
        explain:
          "Naming the corner saves a light cycle and a phone call. Avenues are wide — the wrong corner is a real detour.",
      },
      {
        prompt: "An address on a street says 'between 2nd and 3rd'. That means…",
        options: [
          "Between 2nd and 3rd Avenues",
          "The 2nd and 3rd building",
          "Two to three blocks away",
        ],
        answer: 0,
        explain:
          "Cross-avenues are how New Yorkers actually locate an address. Give yours the same way and cabs will find you.",
      },
    ],
  },
  {
    id: "tipping",
    title: "Tipping Norms",
    blurb: "Restaurants, bars, delivery, and the spinning tablet.",
    emoji: "💸",
    minutes: 3,
    xp: 30,
    questions: [
      {
        prompt: "Sit-down dinner in the city, decent service. Standard tip?",
        options: ["10%", "20%", "Whatever the tablet suggests first"],
        answer: 1,
        explain:
          "20% is the NYC baseline for table service. Quick trick: double the 8.875% tax on the check and you're right there.",
      },
      {
        prompt: "$3 coffee at the counter, screen spins around asking for 25%.",
        options: ["You must tip 25%", "A dollar or nothing is normal", "Counter tipping is rude"],
        answer: 1,
        explain: "Counter service is optional territory. A buck on a made-to-order drink is generous and common.",
      },
      {
        prompt: "Delivery on a rainy night, order was $30.",
        options: ["$1", "$5–6 or more", "Nothing, the app handles it"],
        answer: 1,
        explain:
          "Tip at least 15–20% on delivery, and more in bad weather. Someone biked through it for you.",
      },
    ],
  },
];
