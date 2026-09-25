# Hill Bagger

A map and checklist for bagging British hill lists — Munros, Wainwrights, the Welsh
3000s, Ethels, the Yorkshire Three Peaks and the Dales 30. Tick off each summit as you
climb it and watch every list it belongs to fill in.

**Status: early development.** See [ROADMAP.md](ROADMAP.md) for the plan and the
design decisions behind it.

## Running it locally

Requires Node 24.

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm test` runs the tests; `npm run lint` and `npm run typecheck` check the code.

## Hill data

Summit names, heights, grid references and positions come from **The Database of
British and Irish Hills v18.6**,
[www.hill-bagging.co.uk/dobih](https://www.hill-bagging.co.uk/dobih), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The app uses a generated extract, [`src/data/hills.json`](src/data/hills.json): the
636 hills on its six lists. To regenerate it from a new DoBIH release:

1. Download `hillcsv.zip` from the
   [DoBIH downloads page](https://www.hill-bagging.co.uk/dobih/downloads/) and unzip it.
2. `npm run data:import -- path/to/DoBIH_v18_6.csv`

The import refuses to write data if any list's size has changed. Review the change,
then update `expectedCount` in
[`src/data/list-definitions.ts`](src/data/list-definitions.ts).
