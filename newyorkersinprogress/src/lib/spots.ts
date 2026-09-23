import { SPOT_IMAGES } from "@/lib/images";

export type SpotCategory =
  | "museums"
  | "hidden"
  | "parks"
  | "late"
  | "budget";

export const SPOT_CATEGORIES: { id: SpotCategory; label: string; emoji: string }[] = [
  { id: "museums", label: "Museums & Culture", emoji: "🖼️" },
  { id: "hidden", label: "Hidden Gems", emoji: "🔎" },
  { id: "parks", label: "Parks & Walks", emoji: "🌳" },
  { id: "late", label: "Late Night", emoji: "🌙" },
  { id: "budget", label: "Free / Budget Hacks", emoji: "💸" },
];

export type Spot = {
  id: string;
  name: string;
  category: SpotCategory;
  neighborhood: string;
  borough: string;
  subway: string;
  blurb: string;
  tip: string;
  cost: string;
  image: string;
  xp: number;
};

export const SPOTS: Spot[] = [
  {
    id: "met",
    name: "The Metropolitan Museum of Art",
    category: "museums",
    neighborhood: "Upper East Side",
    borough: "Manhattan",
    subway: "4 5 6 to 86 St",
    blurb: "Two million square feet of everything. Nobody finishes it — pick two wings and leave.",
    tip: "NY, NJ and CT residents still pay-what-you-wish at the desk. Say the amount out loud, show any proof of address, and skip the $30 sticker price.",
    cost: "Pay-what-you-wish for NY residents",
    image: SPOT_IMAGES["met"]!,
    xp: 12,
  },
  {
    id: "tenement",
    name: "Tenement Museum",
    category: "museums",
    neighborhood: "Lower East Side",
    borough: "Manhattan",
    subway: "F to Delancey St",
    blurb: "Guided tours through restored apartments where immigrant families actually lived.",
    tip: "Tours are small and sell out a week ahead — book the 'Hard Times' apartment tour, and go on a weekday morning when the group is closer to eight people than twenty.",
    cost: "$30 · book ahead",
    image: SPOT_IMAGES["tenement"]!,
    xp: 12,
  },
  {
    id: "chelsea",
    name: "Chelsea Gallery Hopping",
    category: "museums",
    neighborhood: "Chelsea",
    borough: "Manhattan",
    subway: "C E to 23 St",
    blurb: "Roughly 200 galleries packed between 10th and 11th Ave, all free to walk into.",
    tip: "Thursday evenings are opening night across the district — free wine, free entry, and nobody checks whether you belong. Start at 526 W 26th St, which stacks a dozen galleries in one building.",
    cost: "Free",
    image: SPOT_IMAGES["chelsea"]!,
    xp: 15,
  },
  {
    id: "ferry",
    name: "Staten Island Ferry",
    category: "budget",
    neighborhood: "Financial District",
    borough: "Manhattan → Staten Island",
    subway: "1 to South Ferry · R W to Whitehall St",
    blurb: "A 25-minute commuter boat that happens to sail past the Statue of Liberty.",
    tip: "Free, always. Stand on the right side going out for the Statue, left side coming back for the skyline. Ignore the $40 tour boats hawking at Battery Park — this is the same view.",
    cost: "Free",
    image: SPOT_IMAGES["ferry"]!,
    xp: 10,
  },
  {
    id: "tram",
    name: "Roosevelt Island Tram",
    category: "hidden",
    neighborhood: "Midtown East",
    borough: "Manhattan → Roosevelt Island",
    subway: "F to Lexington Av/63 St · tram at 59 St & 2 Av",
    blurb: "A genuine aerial cable car over the East River, running as regular transit.",
    tip: "Standard OMNY tap, same fare as the subway, and it free-transfers. Ride at sunset, then walk south to Four Freedoms Park for the quietest skyline view in the city.",
    cost: "One subway fare",
    image: SPOT_IMAGES["tram"]!,
    xp: 12,
  },
  {
    id: "cloisters",
    name: "The Met Cloisters",
    category: "museums",
    neighborhood: "Washington Heights",
    borough: "Manhattan",
    subway: "A to 190 St",
    blurb: "Medieval European monasteries reassembled on a bluff above the Hudson.",
    tip: "Your Met ticket covers the Cloisters for the same day — do the Met in the morning, take the A uptown after lunch, and get two museums for one pay-what-you-wish.",
    cost: "Included with Met ticket",
    image: SPOT_IMAGES["cloisters"]!,
    xp: 15,
  },
  {
    id: "greenwood",
    name: "Green-Wood Cemetery",
    category: "parks",
    neighborhood: "Greenwood Heights",
    borough: "Brooklyn",
    subway: "R to 25 St",
    blurb: "478 hilly acres of Victorian monuments, wild parrots, and the best view in Brooklyn.",
    tip: "Battle Hill is the highest natural point in Brooklyn and almost nobody's up there. Free to walk in during daylight; the monk parakeets nest in the Gothic entrance arch.",
    cost: "Free",
    image: SPOT_IMAGES["greenwood"]!,
    xp: 10,
  },
  {
    id: "littleisland",
    name: "Little Island & the Hudson River Greenway",
    category: "parks",
    neighborhood: "Meatpacking District",
    borough: "Manhattan",
    subway: "L A C E to 14 St / 8 Av",
    blurb: "A park on concrete tulips in the river, then a flat riverside walk in either direction.",
    tip: "Skip the High Line crush and walk the Greenway below it instead — same neighborhoods, a tenth of the people. Little Island needs a free timed pass after noon in summer.",
    cost: "Free",
    image: SPOT_IMAGES["littleisland"]!,
    xp: 10,
  },
  {
    id: "citycity",
    name: "City Reliquary",
    category: "hidden",
    neighborhood: "Williamsburg",
    borough: "Brooklyn",
    subway: "L to Lorimer St · G to Metropolitan Av",
    blurb: "A one-room, volunteer-run museum of NYC ephemera: subway tokens, seltzer bottles, Statue souvenirs.",
    tip: "Suggested donation is $7 and it takes 30 minutes. Ask the volunteer at the desk about anything in a case — they will talk for twenty minutes and it's the whole point of going.",
    cost: "$7 suggested",
    image: SPOT_IMAGES["citycity"]!,
    xp: 12,
  },
  {
    id: "veselka",
    name: "Veselka",
    category: "late",
    neighborhood: "East Village",
    borough: "Manhattan",
    subway: "6 to Astor Pl · L to 1 Av",
    blurb: "Ukrainian diner on 2nd Ave that has been feeding the neighborhood since 1954.",
    tip: "Go after 1am on a weeknight, when the line is gone and it's just night-shift workers. Order the pierogi sampler boiled, not fried, and get borscht even in summer.",
    cost: "$20–30",
    image: SPOT_IMAGES["veselka"]!,
    xp: 10,
  },
  {
    id: "jazz",
    name: "Smalls Jazz Club",
    category: "late",
    neighborhood: "West Village",
    borough: "Manhattan",
    subway: "1 to Christopher St",
    blurb: "A basement room on 10th St where the late set runs until 4am.",
    tip: "One cover buys the whole night, including the 1am jam session where the players from the bigger clubs come to sit in. Cash at the door is faster than the online queue.",
    cost: "$25 cover",
    image: SPOT_IMAGES["jazz"]!,
    xp: 12,
  },
  {
    id: "publib",
    name: "NYPL Stephen A. Schwarzman Building",
    category: "budget",
    neighborhood: "Midtown",
    borough: "Manhattan",
    subway: "7 B D F M to 42 St–Bryant Pk",
    blurb: "The lions, the Rose Reading Room, and free rotating exhibitions in the Gottesman Hall.",
    tip: "A free library card gets you into the reading room and unlocks Culture Pass — free timed admission to 100+ NYC museums, one booking at a time. Sign up online in five minutes.",
    cost: "Free",
    image: SPOT_IMAGES["publib"]!,
    xp: 15,
  },
];
