type Param = string | string[] | undefined;

/** A repeated query parameter (`?a=1&a=2`) is treated as its first value. */
export const firstParam = (value: Param): string | undefined =>
  Array.isArray(value) ? value[0] : value;
