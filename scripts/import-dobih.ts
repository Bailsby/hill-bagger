// Regenerates src/data/hills.json from a DoBIH CSV release.
//
//   1. Download hillcsv.zip from https://www.hill-bagging.co.uk/dobih/downloads/
//   2. Unzip it (it holds one file, DoBIH_v<major>_<minor>.csv)
//   3. npm run data:import -- path/to/DoBIH_v18_6.csv
//
// The CSV itself isn't committed: it's 13 MB covering 20,000+ hills, of which we
// use a few hundred. Runs under Node's built-in TypeScript support, hence the
// .ts extensions on imports.

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { listDefinitions } from "../src/data/list-definitions.ts";
import { parseCsv } from "../src/lib/csv.ts";
import { buildHillData, serialiseHillData } from "./build-hill-data.ts";

const path = process.argv[2];
const version = path ? /DoBIH_v(\d+)_(\d+)\.csv$/i.exec(basename(path)) : null;

if (!path || !version) {
  console.error("Usage: npm run data:import -- path/to/DoBIH_v<major>_<minor>.csv");
  process.exit(1);
}

const [header, ...rows] = parseCsv(readFileSync(path, "utf8"));
const columns = header.map((name) => name.trim());
const records = rows
  .filter((row) => row.length === columns.length)
  .map((row) => Object.fromEntries(columns.map((column, i) => [column, row[i]])));

const data = buildHillData(records, listDefinitions, `${version[1]}.${version[2]}`);
const output = new URL("../src/data/hills.json", import.meta.url);
writeFileSync(output, serialiseHillData(data));

console.log(`DoBIH v${data.source.version}: ${records.length} hills read, ${data.hills.length} kept.`);
listDefinitions.forEach((definition) =>
  console.log(`  ${definition.name.padEnd(22)} ${data.lists[definition.id].length}`),
);
