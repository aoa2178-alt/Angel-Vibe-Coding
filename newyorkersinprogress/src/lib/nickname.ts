// League nicknames: the only thing other players ever see about you.

const BLOCKED = [
  "fuck", "shit", "bitch", "cunt", "nigg", "fag", "whore", "slut", "rape", "nazi",
  "pussy", "cock", "asshole", "retard", "hitler", "porn", "admin", "moderator",
];

/** Tidy and check a nickname. 3–20 letters, numbers or spaces. */
export function checkNickname(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim().replace(/\s+/g, " ");
  if (value.length < 3 || value.length > 20) return { ok: false, error: "Use 3 to 20 characters." };
  if (!/^[A-Za-z0-9 ]+$/.test(value)) return { ok: false, error: "Use letters, numbers and spaces only." };
  const squashed = value.toLowerCase().replace(/ /g, "");
  if (BLOCKED.some((word) => squashed.includes(word))) return { ok: false, error: "Pick a different nickname." };
  return { ok: true, value };
}

const FIRST = ["Bagel", "Bodega", "Subway", "Stoop", "Pizza", "Hero", "Slice", "Ferry", "Express", "Uptown", "Crosstown", "Deli"];
const SECOND = ["Boss", "Regular", "Rider", "Sitter", "Rat", "Hustler", "Champ", "Local", "Legend", "Pro", "Cat", "King"];

/** A fun starting suggestion, like "BagelBoss42". */
export function suggestNickname(random: () => number = Math.random): string {
  const pick = (list: string[]) => list[Math.floor(random() * list.length)]!;
  return `${pick(FIRST)}${pick(SECOND)}${10 + Math.floor(random() * 90)}`;
}
