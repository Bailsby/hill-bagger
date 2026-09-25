/**
 * Parses RFC 4180 CSV: quoted fields may contain commas, newlines and doubled
 * quotes. Written here rather than added as a dependency because it runs once,
 * at import time, over a file whose format we can test against.
 */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      // Treat CRLF as one line break.
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }

  // A final line without a trailing newline.
  if (field !== "" || row.length > 0) rows.push([...row, field]);
  return rows;
};
