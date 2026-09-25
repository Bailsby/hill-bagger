"use client";

import { useMemo, useState } from "react";
import type { CalendarDate } from "@/lib/dates";
import { formatGridRef, formatHeight } from "@/lib/format";
import { viewHills, type ListRow, type Show, type SortKey } from "@/lib/list-view";
import { AscentEditor } from "./ascent-editor";
import { ClimbDateLabel } from "./climb-date-label";
import { StatusIcon } from "./status-icon";

const showOptions: [Show, string][] = [
  ["all", "All"],
  ["todo", "Not yet"],
  ["done", "Climbed"],
];

export function HillList({
  rows,
  canEdit,
  today,
}: {
  rows: ListRow[];
  canEdit: boolean;
  today: CalendarDate;
}) {
  const [query, setQuery] = useState("");
  const [show, setShow] = useState<Show>("all");
  const [sort, setSort] = useState<SortKey>("height");
  const [editing, setEditing] = useState<number | null>(null);

  const climbed = useMemo(() => new Set(rows.filter((row) => row.ascent).map((row) => row.id)), [rows]);
  const visible = useMemo(
    () => viewHills(rows, climbed, { query, show, sort }),
    [rows, climbed, query, show, sort],
  );

  return (
    <section aria-label="Hills">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or area"
          aria-label="Search hills"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="flex gap-3">
          <fieldset className="flex rounded-lg border border-line bg-surface p-0.5">
            <legend className="sr-only">Show</legend>
            {showOptions.map(([value, label]) => (
              <label
                key={value}
                className="rounded-md px-3 py-1.5 text-sm has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
              >
                <input
                  type="radio"
                  name="show"
                  value={value}
                  checked={show === value}
                  onChange={() => setShow(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Sort"
            className="rounded-lg border border-line bg-surface px-2 py-2 text-sm"
          >
            <option value="height">Highest first</option>
            <option value="name">A to Z</option>
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        Showing {visible.length} of {rows.length}
      </p>

      {visible.length === 0 ? (
        <p className="mt-3 rounded-xl border border-line bg-surface p-5 text-muted">No hills match.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
          {visible.map((row) => (
            <li key={row.id} id={`hill-${row.id}`} className="px-4 py-3 sm:px-5">
              <div className="flex items-start gap-3">
                <StatusIcon climbed={row.ascent !== null} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted">
                    {formatHeight(row.metres)} · {row.area} ·{" "}
                    <span className="whitespace-nowrap font-mono text-xs">{formatGridRef(row.gridRef)}</span>
                  </p>
                  {row.alsoOn.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                      <span className="text-muted">Also on</span>
                      {row.alsoOn.map((list) => (
                        <span key={list.id} className="rounded-full bg-brand-soft px-2 py-0.5 text-brand-strong">
                          {list.name}
                        </span>
                      ))}
                    </p>
                  )}
                  {canEdit && row.ascent?.notes && (
                    <p className="mt-1.5 whitespace-pre-line text-sm text-ink/80">{row.ascent.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {row.ascent ? (
                    <ClimbDateLabel climbed={row.ascent.climbed} className="text-sm font-medium text-brand tabular-nums" />
                  ) : (
                    <span className="text-sm text-muted">Not yet</span>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditing(editing === row.id ? null : row.id)}
                      aria-expanded={editing === row.id}
                      className="text-sm font-medium text-brand underline-offset-2 hover:underline"
                    >
                      {row.ascent ? "Edit" : "Mark climbed"}
                    </button>
                  )}
                </div>
              </div>
              {canEdit && editing === row.id && (
                <div className="mt-3 sm:ml-8">
                  <AscentEditor hill={row} ascent={row.ascent} today={today} onClose={() => setEditing(null)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
