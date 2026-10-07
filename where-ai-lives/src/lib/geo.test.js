// Every map point falls inside the state it's filed under (checked on the unprojected us-atlas shapes).
// Plain JavaScript because topojson-client ships no types; both libraries are dev-only.
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import topo from "us-atlas/states-10m.json";
import { describe, expect, it } from "vitest";
import mapJson from "../data/map.json";
import sitesJson from "../data/sites.json";

const nameOf = Object.fromEntries(mapJson.states.map((s) => [s.code, s.name]));
const shapes = Object.fromEntries(feature(topo, topo.objects.states).features.map((f) => [f.properties.name, f]));

describe("Map points", () => {
  it("each site sits inside its own state", () => {
    const outside = sitesJson.sites.filter((s) => !geoContains(shapes[nameOf[s.state]], [s.lon, s.lat])).map((s) => `${s.name} (${s.state})`);
    expect(outside).toEqual([]);
  });

  it("reports how each site was placed", () => {
    const how = sitesJson.sites.reduce((m, s) => ({ ...m, [s.located]: (m[s.located] ?? 0) + 1 }), {});
    expect(how.address + how.zip + how.town).toBe(77);
    expect(how.address).toBeGreaterThan(25);
  });
});
