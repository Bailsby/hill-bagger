import type { ListId } from "./hill-data";

export type ListSource =
  /** A list DoBIH already classifies: members are the rows with a 1 in this column. */
  | { kind: "dobih-column"; column: "M" | "W" | "E" }
  /** A list DoBIH doesn't classify, pinned by DoBIH hill number so name variants can't matter. */
  | { kind: "hill-numbers"; numbers: number[] };

export type ListDefinition = {
  id: ListId;
  name: string;
  region: string;
  description: string;
  source: ListSource;
  /**
   * The import fails if the data disagrees. A list changing size is a real
   * event (a Munro demoted, a hill resurveyed) that deserves a human look, not
   * a silent update.
   */
  expectedCount: number;
};

export const listDefinitions: ListDefinition[] = [
  {
    id: "munros",
    name: "Munros",
    region: "Scottish Highlands",
    description: "Scottish mountains over 3,000 ft, first listed by Sir Hugh Munro in 1891.",
    source: { kind: "dobih-column", column: "M" },
    expectedCount: 282,
  },
  {
    id: "wainwrights",
    name: "Wainwrights",
    region: "Lake District",
    description:
      "The fells described in Alfred Wainwright's Pictorial Guides to the Lakeland Fells.",
    source: { kind: "dobih-column", column: "W" },
    expectedCount: 214,
  },
  {
    id: "welsh-3000s",
    name: "Welsh 3000s",
    region: "Eryri (Snowdonia)",
    description:
      "The fifteen Welsh summits over 3,000 ft, across the Snowdon, Glyderau and Carneddau ranges.",
    // The Welsh Hewitts over 914.4 m. Castell y Gwynt clears the height but is a
    // subsidiary top, not a separate hill, so it isn't on the list.
    source: {
      kind: "hill-numbers",
      numbers: [
        1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977,
      ],
    },
    expectedCount: 15,
  },
  {
    id: "ethels",
    name: "Ethels",
    region: "Peak District",
    description:
      "Peak District hills named after Ethel Haythornthwaite, who campaigned for the national park.",
    source: { kind: "dobih-column", column: "E" },
    expectedCount: 95,
  },
  {
    id: "yorkshire-three-peaks",
    name: "Yorkshire Three Peaks",
    region: "Yorkshire Dales",
    description: "Pen-y-ghent, Whernside and Ingleborough, traditionally walked in a single day.",
    source: { kind: "hill-numbers", numbers: [2779, 2780, 2783] },
    expectedCount: 3,
  },
  {
    id: "dales-30",
    name: "Dales 30",
    region: "Yorkshire Dales",
    description:
      "The Hewitts of the Yorkshire Dales National Park: hills over 2,000 ft with 30 m of drop on every side.",
    // DoBIH's Dales Hewitts less Nine Standards Rigg (2745), which sits just
    // outside the national park boundary. Drumaldrace (2796) is the summit of
    // Wether Fell; sources use either name.
    source: {
      kind: "hill-numbers",
      numbers: [
        2716, 2719, 2720, 2729, 2730, 2732, 2734, 2737, 2740, 2754, 2755, 2759, 2779, 2780, 2781,
        2782, 2783, 2784, 2785, 2786, 2787, 2788, 2790, 2791, 2793, 2795, 2796, 2797, 2799, 2931,
      ],
    },
    expectedCount: 30,
  },
];
