# Hill Bagger — Roadmap

A map and checklist for "bagging" British hill lists: record each summit as you climb it
and watch the lists fill in. It's one person's record, public to view, and it starts with
six lists:

| List                   | Where               | Hills |
| ---------------------- | ------------------- | ----- |
| Munros                 | Scottish Highlands  | 282   |
| Wainwrights            | Lake District       | 214   |
| Welsh 3000s            | Snowdonia / Eryri   | 15    |
| Ethels                 | Peak District       | 95    |
| Yorkshire Three Peaks  | Yorkshire Dales     | 3     |
| Dales 30               | Yorkshire Dales     | 30    |

Counts are indicative. The data, not this table, is the source of truth, and several
of these lists have been revised over the years.

This file records the architectural decisions and their trade-offs. The
[README](README.md) covers what the app does and how to run it.

## A tick belongs to the hill, not the list

The lists overlap. Pen-y-ghent is one of the Yorkshire Three Peaks and one of the
Dales 30. Someone who has climbed it has climbed it for both.

So the data has two layers:

- **Hills**: one record per summit, with a stable id, name, height and position.
- **Lists**: named, ordered collections of hill ids.

Progress is a set of hill ids. A list's progress is derived as the ids it contains that
are also in that set. A hill on three lists is one tick that shows up on all three,
rather than three ticks to keep in sync.

## Hill data comes from one source

Heights and positions come from the
[Database of British and Irish Hills](https://www.hill-bagging.co.uk/dobih/) (DoBIH),
released under a Creative Commons licence. It classifies Munros, Wainwrights and Ethels
directly. The Welsh 3000s, the Yorkshire Three Peaks and the Dales 30 are not DoBIH
lists, so each is defined in this repo as a list of DoBIH hill numbers. Every summit's
figures therefore come from one survey, whichever list it is reached through.

The data is small (a few hundred summits), so it's generated into a static JSON file by
a script and committed. The database holds only what someone did, never the hills
themselves, and a DoBIH update is a script run plus a reviewable diff.

DoBIH is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The
attribution it asks for (database name, version and a link) is in the README and
travels in the data file, so the UI can show it too.

Each list definition records how many hills it should have, and the import refuses to
write data that disagrees. Lists do change: Munros are occasionally promoted or demoted
after a resurvey. When that happens, a person should look at the difference rather than
the data quietly updating.

How the three hand-defined lists were pinned down, against DoBIH v18.6:

- **Welsh 3000s**: exactly the Welsh Hewitts over 914.4 m. Castell y Gwynt clears
  the height but is a subsidiary top, not a separate hill.
- **Dales 30**: defined as the Hewitts inside the Yorkshire Dales National Park. DoBIH
  has no park boundary, so the thirty are pinned by number: DoBIH's Dales Hewitts, less
  Nine Standards Rigg, which lies just outside the park. Published versions name one
  summit either Wether Fell or Drumaldrace, which is the same hill.
- **Yorkshire Three Peaks**: Whernside, Ingleborough and Pen-y-ghent.

## One person's record, public to view

This is a personal tracker, not a service. Anyone can browse the lists and see what its
owner has climbed and when; only the owner can sign in and record climbs.

- **A climb is a hill and a date.** Dates are what make "progress over time" possible,
  so they're recorded from the start rather than bolted on. A climb is stored as a
  calendar date, not a timestamp: "climbed on 12 September" shouldn't shift by a day for
  someone reading it in another time zone.
- **A date is only as precise as the memory.** Old climbs often survive only as a year,
  or not at all, and a guessed date would quietly distort anything that charts progress.
  So each climb records its precision: an exact day, a year (stored as its 1 January), or
  unknown (no date). A database check keeps the date and its precision consistent.
  Undated climbs still count towards every list, but can't appear on a timeline.
- **Notes are private.** Dates are public; notes (route, weather, company) are shown only
  to the owner, and public pages never load them.
- **Progress lives in Postgres**, so it's the same on every device and survives a
  cleared browser. Browser storage was the original plan and was dropped for that reason.
- **One record per hill.** It holds the date the hill was bagged. Recording repeat
  ascents would mean relaxing one unique constraint, not reshaping the data.

### Sign-in: GitHub, owner only

Sign-in is through GitHub, restricted to one account, identified by GitHub's numeric user
id. Usernames can be changed and later reused; the id can't. Email sign-in links would
need a mail provider and a verified sending domain. An OAuth app is simpler and holds no
password.

Anyone else is refused at the sign-in callback and never gets a session. Every write
checks the session again anyway, because a server action can be called directly and
shouldn't trust that the page hid its buttons. With the owner's id unset, nobody can
sign in: a misconfigured deployment is read-only rather than open.

Climbs are still stored against a user record, not globally. Opening the app to other
people later would add sign-up and per-person pages, without reworking the data.

## The map: Ordnance Survey tiles through Leaflet

The base map is Ordnance Survey's **Outdoor** style, the map British walkers already
know, from the OS Maps API on its free OpenData plan. That plan is unlimited and free for
any use, but covers zoom levels 7–16 only; the most detailed levels need a paid plan.

- **What the free levels show.** They're built from OS Open Zoomstack: contours every
  10 m, woodland, water, roads and place names, but no footpaths and no summit labels.
  The app's own markers supply the summits, which is what a map of progress needs.
  Footpaths would need a paid plan or another provider.
- **Fitting Britain on screen.** The whole country only fits at zoom 6, one level below
  what OS serves. The map allows zoom 6 and Leaflet shows the zoom-7 tiles scaled down
  there, rather than requesting tiles that don't exist.
- **The API key is public.** It's in every tile URL, as with any browser map. On the
  OpenData plan that costs nothing if copied, so it isn't proxied through the server.
- **Why not the others.** MapTiler's free tier suspends the map for the rest of the month
  after 5,000 sessions. OpenTopoMap runs on community servers with known capacity
  problems. The standard OpenStreetMap tiles are street-focused, and their usage policy
  discourages this kind of use.
- **Why Leaflet.** It's small, mature, and draws the 636 markers on a canvas without
  strain. Summits are plain circles, climbed ones filled, so no marker images are needed.

Canvas markers can't be reached by keyboard, so the map has a search box that selects and
flies to a summit, and every list page holds the same information in an accessible form.

## Done

1. **Data.** DoBIH import script, the six lists (636 distinct hills), and tests that
   check list sizes, that ids resolve, and that the overlaps come out as expected.
2. **Lists and progress.** Public overview and list pages, with progress per list, the
   most recent climbs, and search, filter and sort on each list. GitHub sign-in for the
   owner, who can record a climb with its date (exact, year only or unknown) and private
   notes, correct it, or remove it. Database tests run against real Postgres.
3. **Map.** Every summit on an OS map, climbed ones filled, filterable by list and by
   climbed or not, with search. Selecting a summit shows its details, and lets the owner
   record the climb from the map.

## Planned

Roughly in order.

4. **Progress over time.** Climbs per year, how each list filled in, and a timeline.
5. **Extras.** Photos per climb, a shareable progress summary, and perhaps repeat ascents.

## Deliberately out of scope

- **Route planning, GPS tracking and navigation.** Established apps do these well, and
  a tick list shouldn't pretend to be something you navigate by on a hill.
- **Weather and conditions.** The same reasoning, with higher stakes for being wrong.
