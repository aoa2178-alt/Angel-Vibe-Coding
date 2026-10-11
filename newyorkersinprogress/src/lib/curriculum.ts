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
  {
    id: "transit",
    title: "Buses, Bikes & Ferries",
    blurb: "Boarding the bus, the free transfer, Citi Bike and the free boat.",
    emoji: "🚌",
    minutes: 3,
    xp: 30,
    questions: [
      {
        prompt: "A local bus pulls up. How do you get on and pay?",
        context: "M14A, First Avenue",
        options: [
          "Board at the front and tap OMNY by the driver",
          "Board at the back and pay when you get off",
          "Wave cash at the driver for change",
        ],
        answer: 0,
        explain:
          "On a local bus you board at the front and tap the OMNY reader. Exit through the back doors so people can get on.",
      },
      {
        prompt: "You tap into the subway, then need a bus for the last mile. What does it cost?",
        options: ["Another full fare", "Nothing: the transfer is free", "Half a fare"],
        answer: 1,
        explain:
          "Tap the same card or phone and a subway-to-bus transfer within two hours is free. Tapping a different card starts a new fare.",
      },
      {
        prompt: "You want to see the Statue of Liberty without paying for a tour.",
        options: ["Take the Staten Island Ferry", "Buy a harbor cruise", "Walk the Brooklyn Bridge"],
        answer: 0,
        explain:
          "The Staten Island Ferry is free and runs around the clock. Stand on the right-hand side going out for the statue view.",
      },
      {
        prompt: "You've finished a Citi Bike ride. What ends it?",
        options: ["Locking it to any pole", "Docking it at a station until it clicks in", "Leaving it on the sidewalk"],
        answer: 1,
        explain:
          "A ride only ends when the bike is docked at a station. Rides have a time limit, so check the app before a long trip.",
      },
    ],
  },
  {
    id: "neighborhoods",
    title: "Neighborhood Names",
    blurb: "SoHo, Tribeca, DUMBO, and how to say Houston.",
    emoji: "🗺️",
    minutes: 2,
    xp: 25,
    questions: [
      {
        prompt: "How do New Yorkers say Houston Street?",
        options: ["HYOO-ston, like the city in Texas", "HOW-stun", "HOOS-ton"],
        answer: 1,
        explain:
          "It's HOW-stun. Saying it like the Texas city is the fastest way to sound new.",
      },
      {
        prompt: "What does the name SoHo mean?",
        options: ["South of Houston Street", "Soho, after the London neighborhood", "South Hoboken"],
        answer: 0,
        explain:
          "SoHo is South of Houston Street. NoHo, just north, is North of Houston.",
      },
      {
        prompt: "Tribeca is short for…",
        options: ["Triangle Below Canal Street", "Tribe of Ecuador", "Three Bridges Area"],
        answer: 0,
        explain:
          "The Triangle Below Canal. A lot of neighborhood names are acronyms that started as real-estate branding.",
      },
      {
        prompt: "DUMBO, in Brooklyn, stands for…",
        options: [
          "Down Under the Manhattan Bridge Overpass",
          "Downtown Under Manhattan's Bay Outlook",
          "It's named after the elephant",
        ],
        answer: 0,
        explain:
          "Down Under the Manhattan Bridge Overpass. Go at golden hour for the famous Washington Street view of the bridge.",
      },
    ],
  },
  {
    id: "apartment",
    title: "Apartment Hunting",
    blurb: "The 40× rule, guarantors, broker fees and application fees.",
    emoji: "🔑",
    minutes: 3,
    xp: 30,
    questions: [
      {
        prompt: "The listing says applicants must earn 40× the rent. Rent is $3,000 a month. What income do they want?",
        options: ["$40,000 a year", "$120,000 a year", "$3,000 a week"],
        answer: 1,
        explain:
          "40 times the monthly rent, as a yearly salary: $3,000 × 40 = $120,000. It's the most common screening rule in the city.",
      },
      {
        prompt: "You don't hit the income rule. What do landlords usually accept instead?",
        options: [
          "A guarantor who earns about 80× the rent, or a guarantor company",
          "A handwritten promise to pay",
          "Nothing, you can't rent",
        ],
        answer: 0,
        explain:
          "A guarantor co-signs the lease. Landlords often want them to earn around 80× the rent; paid guarantor companies are the common fallback.",
      },
      {
        prompt: "The landlord hired the broker who listed the apartment. Who pays the broker fee?",
        options: ["You, the tenant", "The landlord", "It's split 50/50"],
        answer: 1,
        explain:
          "Under the FARE Act (in effect since June 2025), whoever hires the broker pays the fee. If the landlord hired them, the landlord pays.",
      },
      {
        prompt: "An agent asks for a $150 application fee. Is that normal?",
        options: ["Yes, that's standard", "No: New York caps it at $20", "Only for luxury buildings"],
        answer: 1,
        explain:
          "State law caps the background and credit check fee at $20, and you can skip it if you bring a recent report yourself.",
      },
    ],
  },
  {
    id: "weather",
    title: "Weather & Seasons",
    blurb: "Umbrella etiquette, slush corners, hot platforms and layers.",
    emoji: "🌦️",
    minutes: 2,
    xp: 25,
    questions: [
      {
        prompt: "Rainy sidewalk, packed with umbrellas. Someone's coming toward you.",
        options: [
          "Hold yours straight and make them duck",
          "Tilt or lift yours so the umbrellas pass",
          "Close it and run",
        ],
        answer: 1,
        explain:
          "The taller person lifts, the other tilts away. Nobody gets an umbrella spoke in the eye.",
      },
      {
        prompt: "It snowed yesterday. You reach the corner and the curb looks wet. What's there?",
        options: ["Probably nothing", "A slush lake that's deeper than it looks", "A heated sidewalk"],
        answer: 1,
        explain:
          "Melting snow pools at every corner and hides how deep it is. Waterproof boots are a winter essential, not a fashion choice.",
      },
      {
        prompt: "August afternoon, headed into the subway. What should you expect on the platform?",
        options: [
          "Air conditioning, like the trains",
          "Hotter than the street; the trains are the cool part",
          "Cooler air from underground",
        ],
        answer: 1,
        explain:
          "Platforms trap heat in summer while most trains are air-conditioned. Carry water, and wait near the stairs for any breeze.",
      },
      {
        prompt: "It's 25°F outside and you're heading to work in an old building. How do you dress?",
        options: ["One very heavy sweater", "Layers you can take off inside", "Light clothes; it's warm indoors"],
        answer: 1,
        explain:
          "Old buildings are heated by radiators that run hot. Layers let you survive the walk and the overheated office.",
      },
    ],
  },
];
