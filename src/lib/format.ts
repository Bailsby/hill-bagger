const METRES_PER_FOOT = 0.3048;

/** e.g. "1,345 m · 4,411 ft" — walkers think in both. */
export const formatHeight = (metres: number): string => {
  const format = (value: number) => Math.round(value).toLocaleString("en-GB");
  return `${format(metres)} m · ${format(metres / METRES_PER_FOOT)} ft`;
};

/** "NN166712" → "NN 166 712", the way it's printed on OS maps and in guidebooks. */
export const formatGridRef = (gridRef: string): string => {
  const match = /^([A-Z]{2})(\d+)$/.exec(gridRef);
  if (!match || match[2].length % 2 !== 0) return gridRef;
  const half = match[2].length / 2;
  return `${match[1]} ${match[2].slice(0, half)} ${match[2].slice(half)}`;
};

export const formatPercent = (done: number, total: number): string =>
  total === 0 ? "0%" : `${Math.floor((done / total) * 100)}%`;
