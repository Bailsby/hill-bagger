# Hill Bagger

A personal record of bagging British hill lists: the Munros, Wainwrights, Welsh
3000s, Ethels, Yorkshire Three Peaks and Dales 30. Every climb is recorded with its date,
or just the year, or no date where it isn't remembered, and a hill on several lists
counts on each of them. The lists and a map of every summit are public to browse; only
the owner can sign in to record climbs.

**Status: in development.** See [ROADMAP.md](ROADMAP.md) for the plan and the design
decisions behind it.

## Running it locally

Requires Node 24 and Docker.

```bash
cp .env.example .env              # then fill it in (see below)
docker compose up -d --wait       # Postgres on port 5434
npm install
npx prisma migrate dev
npm run dev                       # http://localhost:3000
```

The lists and progress are viewable without signing in. To record climbs you need:

- `AUTH_SECRET`: any random value, e.g. `openssl rand -base64 33`.
- A **GitHub OAuth app** for local use. Create it at
  [github.com/settings/developers](https://github.com/settings/developers) with the
  callback URL `http://localhost:3000/api/auth/callback/github`, then set
  `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`.
- `OWNER_GITHUB_ID`: the numeric id of the one GitHub account allowed to sign in, from
  `https://api.github.com/users/<username>`.

For the map's Ordnance Survey background, set `OS_MAPS_API_KEY` to a key from a project on
the free OpenData plan at [osdatahub.os.uk](https://osdatahub.os.uk). Without it, the map
shows the summits on a blank background.

`npm test` runs the unit tests, and `npm run test:db` runs the database tests on a
separate test database, which it creates automatically. `npm run lint` and
`npm run typecheck` check the code.

## Data and mapping

Summit names, heights, grid references and positions come from **The Database of
British and Irish Hills v18.6**,
[www.hill-bagging.co.uk/dobih](https://www.hill-bagging.co.uk/dobih), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Map tiles are Ordnance Survey's, from the OS Maps API. Contains OS data © Crown
copyright and database right.

The app uses a generated extract, [`src/data/hills.json`](src/data/hills.json): the
636 hills on its six lists. To regenerate it from a new DoBIH release:

1. Download `hillcsv.zip` from the
   [DoBIH downloads page](https://www.hill-bagging.co.uk/dobih/downloads/) and unzip it.
2. `npm run data:import -- path/to/DoBIH_v18_6.csv`

The import refuses to write data if any list's size has changed. Review the change,
then update `expectedCount` in
[`src/data/list-definitions.ts`](src/data/list-definitions.ts).
