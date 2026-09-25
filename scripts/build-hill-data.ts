import type { Hill, HillData, ListId } from "../src/data/hill-data.ts";
import type { ListDefinition } from "../src/data/list-definitions.ts";

/** One DoBIH CSV row, keyed by its (trimmed) column headers. */
export type DobihRecord = Record<string, string>;

const round = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

// Number("") is 0, not NaN — a blank latitude would quietly put a summit off
// West Africa. Blank means missing.
const figure = (value: string | undefined): number =>
  value === undefined || value.trim() === "" ? Number.NaN : Number(value);

const toHill = (record: DobihRecord): Hill => {
  const hill: Hill = {
    id: figure(record.Number),
    name: record.Name.trim(),
    metres: round(figure(record.Metres), 1),
    gridRef: record["Grid ref"].trim(),
    // Five decimal places is about a metre — as precise as a summit needs.
    lat: round(figure(record.Latitude), 5),
    lng: round(figure(record.Longitude), 5),
    // Regions carry DoBIH's section code ("01A: Loch Tay to Perth"); the name is
    // what a person wants to read.
    area: (record.Area || record.Region).trim().replace(/^\w+:\s*/, ""),
  };
  const numbers = [hill.id, hill.metres, hill.lat, hill.lng];
  if (!numbers.every(Number.isFinite) || hill.name === "") {
    throw new Error(`DoBIH hill ${record.Number} has missing or malformed fields`);
  }
  return hill;
};

const membersOf = (
  definition: ListDefinition,
  records: readonly DobihRecord[],
  byNumber: ReadonlyMap<number, DobihRecord>,
): number[] => {
  const { source } = definition;
  const members =
    source.kind === "dobih-column"
      ? records.filter((record) => record[source.column] === "1").map((record) => Number(record.Number))
      : source.numbers;

  const missing = members.filter((id) => !byNumber.has(id));
  if (missing.length > 0) {
    throw new Error(`${definition.name}: DoBIH has no hill numbered ${missing.join(", ")}`);
  }
  if (new Set(members).size !== members.length) {
    throw new Error(`${definition.name}: a hill is listed twice`);
  }
  if (members.length !== definition.expectedCount) {
    throw new Error(
      `${definition.name}: expected ${definition.expectedCount} hills, found ${members.length}. ` +
        "If DoBIH has genuinely changed the list, update expectedCount after checking the difference.",
    );
  }
  return [...members].sort((a, b) => a - b);
};

/**
 * Selects every hill on any list from the DoBIH rows. Each hill is stored once,
 * however many lists it belongs to; lists hold ids. Everything is sorted by id
 * so a DoBIH update produces a small, readable diff.
 */
export const buildHillData = (
  records: readonly DobihRecord[],
  definitions: readonly ListDefinition[],
  version: string,
): HillData => {
  const byNumber = new Map(records.map((record) => [Number(record.Number), record]));

  const lists = Object.fromEntries(
    definitions.map((definition) => [definition.id, membersOf(definition, records, byNumber)]),
  ) as Record<ListId, number[]>;

  const ids = [...new Set(Object.values(lists).flat())].sort((a, b) => a - b);

  return {
    source: {
      name: "The Database of British and Irish Hills",
      version,
      url: "https://www.hill-bagging.co.uk/dobih",
      licence: "CC BY 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
    hills: ids.map((id) => toHill(byNumber.get(id) as DobihRecord)),
    lists,
  };
};

/** JSON with one hill per line: compact, but still diffs line by line. */
export const serialiseHillData = (data: HillData): string =>
  [
    "{",
    `  "source": ${JSON.stringify(data.source)},`,
    `  "hills": [`,
    data.hills.map((hill) => `    ${JSON.stringify(hill)}`).join(",\n"),
    "  ],",
    `  "lists": {`,
    Object.entries(data.lists)
      .map(([id, members]) => `    ${JSON.stringify(id)}: ${JSON.stringify(members)}`)
      .join(",\n"),
    "  }",
    "}",
    "",
  ].join("\n");
