import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { findUserByGithubId, listAscents, removeAscent, saveAscent } from "./ascents";
import type { ClimbDate } from "./climb-date";

let owner: string;
let someoneElse: string;

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE "Ascent", "User" CASCADE`);
  owner = (await prisma.user.create({ data: { githubId: "61545700", name: "Jake Bailey" } })).id;
  someoneElse = (await prisma.user.create({ data: { githubId: "1" } })).id;
});

afterAll(() => prisma.$disconnect());

const penYGhent = 2783;
const whernside = 2779;
const ingleborough = 2780;
const on = (date: string): ClimbDate => ({ precision: "day", date });

describe("ascents", () => {
  it("records climbs and lists them newest first", async () => {
    await saveAscent(owner, { hillId: whernside, climbed: on("2026-05-01"), notes: null });
    await saveAscent(owner, { hillId: penYGhent, climbed: on("2026-09-12"), notes: "Clear day" });

    expect(await listAscents(owner, { includeNotes: true })).toEqual([
      { hillId: penYGhent, climbed: on("2026-09-12"), notes: "Clear day" },
      { hillId: whernside, climbed: on("2026-05-01"), notes: null },
    ]);
  });

  it("keeps the calendar date exactly, including across a clock change", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbed: on("2026-03-29"), notes: null });
    expect((await listAscents(owner, { includeNotes: false }))[0].climbed).toEqual(on("2026-03-29"));
  });

  it("round-trips year-only and unknown dates, ordering undated climbs last", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbed: { precision: "unknown" }, notes: null });
    await saveAscent(owner, { hillId: whernside, climbed: { precision: "year", year: 2015 }, notes: null });
    await saveAscent(owner, { hillId: ingleborough, climbed: on("2015-06-20"), notes: null });

    expect((await listAscents(owner, { includeNotes: false })).map((a) => a.climbed)).toEqual([
      on("2015-06-20"),
      { precision: "year", year: 2015 },
      { precision: "unknown" },
    ]);
  });

  it("keeps one record per hill, updating the date, its precision and the notes", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbed: on("2026-09-12"), notes: "First go" });
    await saveAscent(owner, { hillId: penYGhent, climbed: { precision: "year", year: 2014 }, notes: null });

    expect(await listAscents(owner, { includeNotes: true })).toEqual([
      { hillId: penYGhent, climbed: { precision: "year", year: 2014 }, notes: null },
    ]);
  });

  it("leaves notes out unless asked for them", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbed: on("2026-09-12"), notes: "Private" });
    expect(await listAscents(owner, { includeNotes: false })).toEqual([
      { hillId: penYGhent, climbed: on("2026-09-12"), notes: null },
    ]);
  });

  it("removes a climb, and treats removing a missing one as done", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbed: on("2026-09-12"), notes: null });
    await removeAscent(owner, penYGhent);
    await removeAscent(owner, penYGhent);
    expect(await listAscents(owner, { includeNotes: false })).toEqual([]);
  });

  it("keeps each person's climbs separate", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbed: on("2026-09-12"), notes: null });
    await saveAscent(someoneElse, { hillId: whernside, climbed: on("2026-09-13"), notes: null });
    await removeAscent(someoneElse, penYGhent);

    expect((await listAscents(owner, { includeNotes: false })).map((a) => a.hillId)).toEqual([penYGhent]);
    expect((await listAscents(someoneElse, { includeNotes: false })).map((a) => a.hillId)).toEqual([
      whernside,
    ]);
  });

  it("finds a user by GitHub id", async () => {
    expect((await findUserByGithubId("61545700"))?.name).toBe("Jake Bailey");
    expect(await findUserByGithubId("nobody")).toBeNull();
  });
});

describe("database constraints", () => {
  // These write directly, bypassing the app, to show the database itself
  // refuses data the app should never produce.
  const insert = (data: { hillId?: number; climbedOn: Date | null; precision: "DAY" | "YEAR" | "UNKNOWN" }) =>
    prisma.ascent.create({ data: { userId: owner, hillId: penYGhent, ...data } });

  it("refuses bad hill ids and dates before 1900", async () => {
    await expect(insert({ hillId: -1, climbedOn: new Date("2026-09-12"), precision: "DAY" })).rejects.toThrow();
    await expect(insert({ climbedOn: new Date("1850-01-01"), precision: "DAY" })).rejects.toThrow();
  });

  it("refuses a date that disagrees with its precision", async () => {
    await expect(insert({ climbedOn: null, precision: "DAY" })).rejects.toThrow();
    await expect(insert({ climbedOn: new Date("2015-06-20"), precision: "YEAR" })).rejects.toThrow();
    await expect(insert({ climbedOn: new Date("2015-01-01"), precision: "UNKNOWN" })).rejects.toThrow();
  });

  it("accepts each precision with a matching date", async () => {
    await insert({ climbedOn: new Date("2015-01-01"), precision: "YEAR" });
    await prisma.ascent.create({
      data: { userId: owner, hillId: whernside, climbedOn: null, precision: "UNKNOWN" },
    });
    expect(await prisma.ascent.count()).toBe(2);
  });
});
