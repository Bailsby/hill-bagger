"use client";

import { useMemo, useState, useTransition } from "react";
import { removeAscentAction, saveAscentAction, type ActionResult } from "@/app/actions";
import { MAX_NOTES } from "@/lib/ascent-input";
import { addDays, formatCalendarDate, type CalendarDate } from "@/lib/dates";
import { formatGridRef, formatHeight } from "@/lib/format";
import { viewHills, type ListRow, type Show, type SortKey } from "@/lib/list-view";

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
                    <span className="font-mono text-xs">{formatGridRef(row.gridRef)}</span>
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
                    <time dateTime={row.ascent.climbedOn} className="text-sm font-medium text-brand tabular-nums">
                      {formatCalendarDate(row.ascent.climbedOn)}
                    </time>
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
                <AscentEditor row={row} today={today} onClose={() => setEditing(null)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusIcon({ climbed }: { climbed: boolean }) {
  return climbed ? (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-brand" fill="currentColor" role="img" aria-label="Climbed">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-line" fill="none" stroke="currentColor" strokeWidth={2} role="img" aria-label="Not yet climbed">
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}

// onSubmit rather than a form action: React resets a form after an action
// completes, which would wipe what was typed when the save is rejected.
function AscentEditor({
  row,
  today,
  onClose,
}: {
  row: ListRow;
  today: CalendarDate;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: (form: FormData) => Promise<ActionResult>, form: FormData) =>
    startTransition(async () => {
      setError(null);
      const result = await action(form);
      if (result.ok) onClose();
      else setError(result.error);
    });

  const remove = () => {
    if (!window.confirm(`Remove ${row.name} from your climbed hills?`)) return;
    const form = new FormData();
    form.set("hillId", String(row.id));
    run(removeAscentAction, form);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(saveAscentAction, new FormData(event.currentTarget));
      }}
      className="mt-3 space-y-3 rounded-lg border border-line bg-canvas p-4 sm:ml-8"
    >
      <input type="hidden" name="hillId" value={row.id} />
      <div>
        <label htmlFor={`climbed-on-${row.id}`} className="block text-sm font-medium">
          Date climbed
        </label>
        <input
          id={`climbed-on-${row.id}`}
          type="date"
          name="climbedOn"
          required
          min="1900-01-01"
          max={addDays(today, 1)}
          defaultValue={row.ascent?.climbedOn ?? today}
          className="mt-1 rounded-lg border border-line bg-surface px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor={`notes-${row.id}`} className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(only you can see these)</span>
        </label>
        <textarea
          id={`notes-${row.id}`}
          name="notes"
          rows={2}
          maxLength={MAX_NOTES}
          defaultValue={row.ascent?.notes ?? ""}
          placeholder="Route, weather, who you went with…"
          className="mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm hover:bg-line/60">
          Cancel
        </button>
        {row.ascent && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
