# Hill Bagger — Roadmap

A map and checklist for "bagging" British hill lists: tick off each summit as you climb it
and watch the lists fill in. It starts with six lists:

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
a script and committed. The app needs no database to show the lists or the map, and a
DoBIH update is a script run plus a reviewable diff.

To confirm before first release: the exact licence version and attribution wording on
the DoBIH downloads page, and the current membership of the three hand-defined lists.

## Progress starts on the device

Phase one stores ticks in the browser. There's no sign-up, so it works the moment the
page opens. The cost is that progress doesn't follow someone between phone and laptop.
Export and import (a small JSON file) bridge that until accounts exist.

Progress is kept behind a small storage interface (read the set, add, remove), so adding
server-side storage later changes where ticks are kept, not the code that uses them. When
accounts arrive, a first sign-in merges the device's ticks into the account rather than
choosing one over the other.

## Planned

Roughly in order.

1. **Data.** DoBIH import script, the six lists, and tests that check list sizes, that
   ids resolve, and that the overlaps come out as expected.
2. **Lists and ticking.** Browse each list sorted by name or height, tick hills off,
   and see progress per list. Stored on the device, with export and import.
3. **Map.** Every summit on a map, coloured by done or not done, filterable by list,
   and tickable from the map. The mapping library and tile provider are still to be
   chosen: free-tier limits and licence terms decide it.
4. **Accounts and sync.** Email-link sign-in with no password, and progress stored
   server-side and merged with the device on first sign-in.
5. **Extras.** Date climbed and notes per hill, and a shareable progress summary.

## Deliberately out of scope

- **Route planning, GPS tracking and navigation.** Established apps do these well, and
  a tick list shouldn't pretend to be something you navigate by on a hill.
- **Weather and conditions.** The same reasoning, with higher stakes for being wrong.
