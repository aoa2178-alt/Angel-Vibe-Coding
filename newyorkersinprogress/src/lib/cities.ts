export type City = {
  id: string;
  name: string;
  country: string;
  flag: string;
  landmark: string;
  tagline: string;
  blurb: string;
  status: "live" | "soon";
  votes: number;
};

export const CITIES: City[] = [
  {
    id: "nyc",
    name: "New York City",
    country: "United States",
    flag: "🇺🇸",
    landmark: "🗽",
    tagline: "OMNY, bodegas & sidewalk speed",
    blurb: "Subway rules, deli orders, tipping and the street grid.",
    status: "live",
    votes: 0,
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    landmark: "🎡",
    tagline: "Mind the Gap",
    blurb: "Oyster taps, queue discipline, pub rounds and stand-right escalators.",
    status: "soon",
    votes: 412,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    landmark: "🗼",
    tagline: "Train etiquette & onsen rules",
    blurb: "Silent carriages, konbini runs, shoes off and no tipping, ever.",
    status: "soon",
    votes: 508,
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    landmark: "🗼",
    tagline: "Boulangerie & Métro savvy",
    blurb: "Bonjour first, baguette timing, café terrace codes and Navigo passes.",
    status: "soon",
    votes: 366,
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    flag: "🇩🇪",
    landmark: "🚪",
    tagline: "Pfand, Anmeldung & club doors",
    blurb: "Bottle deposits, registration paperwork, cash-only kiosks, Sunday silence.",
    status: "soon",
    votes: 289,
  },
  {
    id: "sf",
    name: "San Francisco",
    country: "United States",
    flag: "🇺🇸",
    landmark: "🌉",
    tagline: "Layers, hills & fog logic",
    blurb: "Microclimates, Clipper cards, Muni vs BART and burrito geography.",
    status: "soon",
    votes: 231,
  },
];
