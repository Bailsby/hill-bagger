import { describe, expect, it } from "vitest";
import type { ListId } from "@/data/hill-data";
import { boundsOf, filterMapHills, osAttribution, osTileUrl, searchHills, type MapHill } from "./map-view";

const hill = (id: number, name: string, lat: number, lng: number, listIds: ListId[], climbed = false): MapHill => ({
  id,
  name,
  metres: 1000 - id,
  lat,
  lng,
  gridRef: "NN000000",
  area: "Somewhere",
  listIds,
  ascent: climbed ? { climbed: { precision: "year", year: 2015 }, notes: null } : null,
});

const benNevis = hill(1, "Ben Nevis [Beinn Nibheis]", 56.797, -5.004, ["munros"], true);
const scafell = hill(2, "Scafell Pike", 54.454, -3.212, ["wainwrights"]);
const penYGhent = hill(3, "Pen-y-ghent", 54.155, -2.249, ["yorkshire-three-peaks", "dales-30"], true);
const hills = [benNevis, scafell, penYGhent];

const ids = (result: MapHill[]) => result.map((h) => h.id);

describe("filterMapHills", () => {
  it("keeps summits on any chosen list", () => {
    expect(ids(filterMapHills(hills, { lists: new Set(["munros", "dales-30"]), show: "all" }))).toEqual([1, 3]);
  });

  it("counts a summit on two lists once, whichever of them is chosen", () => {
    expect(ids(filterMapHills(hills, { lists: new Set(["dales-30"]), show: "all" }))).toEqual([3]);
    expect(ids(filterMapHills(hills, { lists: new Set(["yorkshire-three-peaks", "dales-30"]), show: "all" }))).toEqual([3]);
  });

  it("narrows to climbed or not yet", () => {
    const every = new Set<ListId>(["munros", "wainwrights", "dales-30"]);
    expect(ids(filterMapHills(hills, { lists: every, show: "done" }))).toEqual([1, 3]);
    expect(ids(filterMapHills(hills, { lists: every, show: "todo" }))).toEqual([2]);
  });

  it("shows nothing when no list is chosen", () => {
    expect(filterMapHills(hills, { lists: new Set(), show: "all" })).toEqual([]);
  });
});

describe("boundsOf", () => {
  it("boxes the summits", () => {
    expect(boundsOf(hills)).toEqual([
      [54.155, -5.004],
      [56.797, -2.249],
    ]);
  });

  it("is null for no summits", () => {
    expect(boundsOf([])).toBeNull();
  });
});

describe("searchHills", () => {
  it("matches anywhere in the name, ignoring case and accents, starting-with first", () => {
    const many = [
      hill(10, "Sgùrr nan Gillean", 57.25, -6.19, ["munros"]),
      hill(11, "Beinn Sgulaird", 56.56, -5.17, ["munros"]),
    ];
    expect(ids(searchHills(many, "sgu"))).toEqual([10, 11]);
    expect(ids(searchHills(many, "SGURR"))).toEqual([10]);
  });

  it("returns nothing for an empty query and respects the limit", () => {
    expect(searchHills(hills, "  ")).toEqual([]);
    expect(searchHills(hills, "e", 2)).toHaveLength(2);
  });
});

describe("OS tiles", () => {
  it("builds the Outdoor tile URL with the key encoded", () => {
    expect(osTileUrl("a b&c")).toBe(
      "https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=a%20b%26c",
    );
  });

  it("credits OS as its licence requires", () => {
    expect(osAttribution(2026)).toBe("Contains OS data © Crown copyright and database right 2026");
  });
});
