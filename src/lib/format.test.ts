import { describe, expect, it } from "vitest";
import { formatGridRef, formatHeight, formatPercent } from "./format";

describe("formatHeight", () => {
  it("gives metres and feet", () => {
    expect(formatHeight(1344.5)).toBe("1,345 m · 4,411 ft");
    expect(formatHeight(694.1)).toBe("694 m · 2,277 ft");
  });

  it("puts a 3,000 ft hill at 3,000 ft", () => {
    expect(formatHeight(914.4)).toBe("914 m · 3,000 ft");
  });
});

describe("formatGridRef", () => {
  it("spaces a grid reference as OS maps print it", () => {
    expect(formatGridRef("NN166712")).toBe("NN 166 712");
    expect(formatGridRef("SD8397733400")).toBe("SD 83977 33400");
  });

  it("leaves anything unexpected alone", () => {
    expect(formatGridRef("")).toBe("");
    expect(formatGridRef("NN16671")).toBe("NN16671");
  });
});

describe("formatPercent", () => {
  it("rounds down, so 99.9% never shows as 100%", () => {
    expect(formatPercent(281, 282)).toBe("99%");
    expect(formatPercent(282, 282)).toBe("100%");
    expect(formatPercent(0, 0)).toBe("0%");
  });
});
