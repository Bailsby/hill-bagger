import type { Hill, HillData, ListId } from "@/data/hill-data";
import rawData from "@/data/hills.json";
import { listDefinitions, type ListDefinition } from "@/data/list-definitions";

// Assigning (not casting) checks the generated JSON against the declared shape
// at compile time.
const data: HillData = rawData;

export type HillList = Omit<ListDefinition, "source" | "expectedCount"> & {
  hillIds: readonly number[];
};

export type Progress = { done: number; total: number };

export const dataSource = data.source;

export const hills: readonly Hill[] = data.hills;

export const hillsById: ReadonlyMap<number, Hill> = new Map(hills.map((hill) => [hill.id, hill]));

/** The lists in display order, each with its members. */
export const hillLists: readonly HillList[] = listDefinitions.map(
  ({ id, name, region, description }) => ({ id, name, region, description, hillIds: data.lists[id] }),
);

export const getList = (id: ListId): HillList | undefined => hillLists.find((list) => list.id === id);

/**
 * Progress through one list. Ticks are per hill, so a hill climbed once counts
 * towards every list that includes it.
 */
export const listProgress = (list: HillList, ticked: ReadonlySet<number>): Progress => ({
  done: list.hillIds.filter((id) => ticked.has(id)).length,
  total: list.hillIds.length,
});

/** Every list a hill belongs to — shown alongside it, and updated by one tick. */
export const listsContaining = (hillId: number): HillList[] =>
  hillLists.filter((list) => list.hillIds.includes(hillId));
