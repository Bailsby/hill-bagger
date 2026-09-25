import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { findUserByGithubId, listAscents, removeAscent, saveAscent } from "./ascents";

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

describe("ascents", () => {
  it("records ascents and lists them newest first", async () => {
    await saveAscent(owner, { hillId: whernside, climbedOn: "2026-05-01", notes: null });
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-09-12", notes: "Clear day" });

    expect(await listAscents(owner, { includeNotes: true })).toEqual([
      { hillId: penYGhent, climbedOn: "2026-09-12", notes: "Clear day" },
      { hillId: whernside, climbedOn: "2026-05-01", notes: null },
    ]);
  });

  it("keeps the calendar date exactly, including across a clock change", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-03-29", notes: null });
    expect((await listAscents(owner, { includeNotes: false }))[0].climbedOn).toBe("2026-03-29");
  });

  it("keeps one record per hill, updating the date and notes", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-09-12", notes: "First go" });
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-08-30", notes: null });

    expect(await listAscents(owner, { includeNotes: true })).toEqual([
      { hillId: penYGhent, climbedOn: "2026-08-30", notes: null },
    ]);
  });

  it("leaves notes out unless asked for them", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-09-12", notes: "Private" });
    expect(await listAscents(owner, { includeNotes: false })).toEqual([
      { hillId: penYGhent, climbedOn: "2026-09-12", notes: null },
    ]);
  });

  it("removes an ascent, and treats removing a missing one as done", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-09-12", notes: null });
    await removeAscent(owner, penYGhent);
    await removeAscent(owner, penYGhent);
    expect(await listAscents(owner, { includeNotes: false })).toEqual([]);
  });

  it("keeps each person's ascents separate", async () => {
    await saveAscent(owner, { hillId: penYGhent, climbedOn: "2026-09-12", notes: null });
    await saveAscent(someoneElse, { hillId: whernside, climbedOn: "2026-09-13", notes: null });
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

  it("refuses bad data at the database, even if the app let it through", async () => {
    await expect(
      prisma.ascent.create({
        data: { userId: owner, hillId: -1, climbedOn: new Date("2026-09-12") },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.ascent.create({
        data: { userId: owner, hillId: penYGhent, climbedOn: new Date("1850-01-01") },
      }),
    ).rejects.toThrow();
  });
});
