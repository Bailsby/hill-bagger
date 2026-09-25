import { describe, expect, it } from "vitest";
import { isOwner } from "./owner";

describe("isOwner", () => {
  it("accepts the owner's account", () => {
    expect(isOwner("61545700", "61545700")).toBe(true);
  });

  it("tolerates stray whitespace in the configured id", () => {
    expect(isOwner("61545700", " 61545700\n")).toBe(true);
  });

  it("refuses anyone else", () => {
    expect(isOwner("12345", "61545700")).toBe(false);
    expect(isOwner(undefined, "61545700")).toBe(false);
    expect(isOwner(null, "61545700")).toBe(false);
  });

  it("refuses everyone when no owner is configured", () => {
    expect(isOwner("61545700", undefined)).toBe(false);
    expect(isOwner("", "")).toBe(false);
    expect(isOwner(undefined, undefined)).toBe(false);
  });
});
