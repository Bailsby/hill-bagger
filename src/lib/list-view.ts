import type { Hill, ListId } from "@/data/hill-data";
import type { ClimbDate } from "./climb-date";

/** A hill as a list page shows it, with the other lists it also counts towards. */
export type HillRow = Hill & { alsoOn: { id: ListId; name: string }[] };

/** A row on a list page: the hill, and when it was climbed if it has been. */
export type ListRow = HillRow & {
  ascent: { climbed: ClimbDate; notes: string | null } | null;
};

export type SortKey = "height" | "name";
export type Show = "all" | "todo" | "done";

export type ViewOptions = { sort: SortKey; show: Show; query: string };

/** Which hills are climbed. A Set of ids or a Map of ascents by hill id both fit. */
export type Climbed = { has: (hillId: number) => boolean };

// Case- and accent-insensitive, so "beinn" finds "Beinn" and "Beìnn" alike.
const normalise = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const byHeight = (a: HillRow, b: HillRow) => b.metres - a.metres || a.name.localeCompare(b.name, "en-GB");
const byName = (a: HillRow, b: HillRow) => a.name.localeCompare(b.name, "en-GB") || b.metres - a.metres;

export const viewHills = <T extends HillRow>(
  rows: readonly T[],
  climbed: Climbed,
  { sort, show, query }: ViewOptions,
): T[] => {
  const needle = normalise(query.trim());
  return rows
    .filter((row) => show === "all" || (show === "done") === climbed.has(row.id))
    .filter(
      (row) =>
        needle === "" || normalise(row.name).includes(needle) || normalise(row.area).includes(needle),
    )
    .sort(sort === "height" ? byHeight : byName);
};
