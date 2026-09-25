import type { Hill, ListId } from "@/data/hill-data";
import type { ClimbDate } from "./climb-date";
import type { Show } from "./list-view";

/** A summit as the map shows it. */
export type MapHill = Hill & {
  listIds: ListId[];
  ascent: { climbed: ClimbDate; notes: string | null } | null;
};

export type LatLngBounds = [[number, number], [number, number]];

export type MapFilter = { lists: ReadonlySet<ListId>; show: Show };

// The OS Maps API free (OpenData) plan serves zoom 7–16 in Web Mercator; the
// levels beyond need a paid plan and fail without one. Great Britain only fits
// on screen at zoom 6, so the map goes one level further out and Leaflet shows
// the zoom 7 tiles scaled down there, rather than requesting tiles OS lacks.
export const OS_MIN_NATIVE_ZOOM = 7;
export const MIN_ZOOM = 6;
export const MAX_ZOOM = 16;

/** Great Britain, with a margin. The map can't be dragged beyond it. */
export const GB_BOUNDS: LatLngBounds = [
  [49.5, -9.5],
  [61.2, 2.5],
];

export const osTileUrl = (apiKey: string): string =>
  `https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;

/** The credit OS requires wherever its mapping is shown. */
export const osAttribution = (year: number): string =>
  `Contains OS data © Crown copyright and database right ${year}`;

/** Summits on any of the chosen lists, narrowed to climbed or not yet. */
export const filterMapHills = (hills: readonly MapHill[], { lists, show }: MapFilter): MapHill[] =>
  hills.filter(
    (hill) =>
      hill.listIds.some((id) => lists.has(id)) &&
      (show === "all" || (show === "done") === (hill.ascent !== null)),
  );

/** The smallest box around some summits, or null for none. */
export const boundsOf = (hills: readonly Pick<Hill, "lat" | "lng">[]): LatLngBounds | null =>
  hills.length === 0
    ? null
    : [
        [Math.min(...hills.map((hill) => hill.lat)), Math.min(...hills.map((hill) => hill.lng))],
        [Math.max(...hills.map((hill) => hill.lat)), Math.max(...hills.map((hill) => hill.lng))],
      ];

// Case- and accent-insensitive, like the list search.
const normalise = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Summits whose name matches, names starting with the query first. */
export const searchHills = <T extends Pick<Hill, "name" | "metres">>(
  hills: readonly T[],
  query: string,
  limit = 8,
): T[] => {
  const needle = normalise(query.trim());
  if (needle === "") return [];
  const matches = hills.filter((hill) => normalise(hill.name).includes(needle));
  const startsWith = (hill: T) => (normalise(hill.name).startsWith(needle) ? 0 : 1);
  return [...matches]
    .sort((a, b) => startsWith(a) - startsWith(b) || b.metres - a.metres)
    .slice(0, limit);
};
