import subway from "@/assets/nyc-subway.jpg";
import bodega from "@/assets/nyc-bodega.jpg";
import bagel from "@/assets/nyc-bagel.jpg";
import brownstone from "@/assets/nyc-brownstone.jpg";
import tipping from "@/assets/nyc-tipping.jpg";
import crosswalk from "@/assets/nyc-crosswalk.jpg";
import celebrate from "@/assets/nyc-celebrate.jpg";

import spotMet from "@/assets/spot-met.jpg";
import spotTenement from "@/assets/spot-tenement.jpg";
import spotChelsea from "@/assets/spot-chelsea.jpg";
import spotFerry from "@/assets/spot-ferry.jpg";
import spotTram from "@/assets/spot-tram.jpg";
import spotCloisters from "@/assets/spot-cloisters.jpg";
import spotGreenwood from "@/assets/spot-greenwood.jpg";
import spotLittleIsland from "@/assets/spot-littleisland.jpg";
import spotReliquary from "@/assets/spot-reliquary.jpg";
import spotVeselka from "@/assets/spot-veselka.jpg";
import spotJazz from "@/assets/spot-jazz.jpg";
import spotLibrary from "@/assets/spot-library.jpg";

/** Hero banner — used once, nowhere else. */
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80&auto=format&fit=crop";

/** Social preview only (absolute URL required). */
export const SOCIAL_IMAGE =
  "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1200&q=80&auto=format&fit=crop";

/** Manhattan street grid from above — lesson card only. */
export const GRID_IMAGE =
  "https://images.unsplash.com/photo-1543716091-a840c05249ec?w=1200&q=80&auto=format&fit=crop";

export const CROSSWALK_IMAGE = crosswalk;
export const BROWNSTONE_IMAGE = brownstone;

/** One unique photo per lesson. */
export const LESSON_IMAGES: Record<string, string> = {
  omny: subway,
  cadence: crosswalk,
  bodega: bodega,
  bagel: bagel,
  grid: GRID_IMAGE,
  tipping: tipping,
};

/** One unique photo per Things to Do spot. */
export const SPOT_IMAGES: Record<string, string> = {
  met: spotMet,
  tenement: spotTenement,
  chelsea: spotChelsea,
  ferry: spotFerry,
  tram: spotTram,
  cloisters: spotCloisters,
  greenwood: spotGreenwood,
  littleisland: spotLittleIsland,
  citycity: spotReliquary,
  veselka: spotVeselka,
  jazz: spotJazz,
  publib: spotLibrary,
};

/** Celebration / completion screens — not used anywhere else. */
export const CELEBRATION_IMAGES = [celebrate, brownstone];
