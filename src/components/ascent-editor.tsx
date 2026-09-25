"use client";

import { useState, useTransition } from "react";
import { removeAscentAction, saveAscentAction, type ActionResult } from "@/app/actions";
import { EARLIEST_YEAR, MAX_NOTES, latestClimbDate } from "@/lib/ascent-input";
import type { ClimbDate, Precision } from "@/lib/climb-date";
import type { CalendarDate } from "@/lib/dates";

const precisionOptions: [Precision, string][] = [
  ["day", "Exact date"],
  ["year", "Year only"],
  ["unknown", "Don't know"],
];

export type EditableAscent = { climbed: ClimbDate; notes: string | null } | null;

/**
 * Records, corrects or removes a climb. Uses onSubmit rather than a form
 * action: React resets a form after an action completes, which would wipe
 * what was typed when the save is rejected.
 */
export function AscentEditor({
  hill,
  ascent,
  today,
  onClose,
}: {
  hill: { id: number; name: string };
  ascent: EditableAscent;
  today: CalendarDate;
  onClose: () => void;
}) {
  const [precision, setPrecision] = useState<Precision>(ascent?.climbed.precision ?? "day");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const latest = latestClimbDate(today);

  const run = (action: (form: FormData) => Promise<ActionResult>, form: FormData) =>
    startTransition(async () => {
      setError(null);
      const result = await action(form);
      if (result.ok) onClose();
      else setError(result.error);
    });

  const remove = () => {
    if (!window.confirm(`Remove ${hill.name} from your climbed hills?`)) return;
    const form = new FormData();
    form.set("hillId", String(hill.id));
    run(removeAscentAction, form);
  };

  const field = "mt-1 rounded-lg border border-line bg-surface px-3 py-2";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(saveAscentAction, new FormData(event.currentTarget));
      }}
      className="space-y-3 rounded-lg border border-line bg-canvas p-4"
    >
      <input type="hidden" name="hillId" value={hill.id} />

      <fieldset>
        <legend className="text-sm font-medium">When did you climb it?</legend>
        <div className="mt-1 inline-flex flex-wrap rounded-lg border border-line bg-surface p-0.5">
          {precisionOptions.map(([value, label]) => (
            <label
              key={value}
              className="rounded-md px-3 py-1.5 text-sm has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
            >
              <input
                type="radio"
                name="precision"
                value={value}
                checked={precision === value}
                onChange={() => setPrecision(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {precision === "day" && (
        <div>
          <label htmlFor={`climbed-on-${hill.id}`} className="block text-sm font-medium">
            Date climbed
          </label>
          <input
            id={`climbed-on-${hill.id}`}
            type="date"
            name="climbedOn"
            required
            min={`${EARLIEST_YEAR}-01-01`}
            max={latest}
            defaultValue={ascent?.climbed.precision === "day" ? ascent.climbed.date : today}
            className={field}
          />
        </div>
      )}

      {precision === "year" && (
        <div>
          <label htmlFor={`climbed-year-${hill.id}`} className="block text-sm font-medium">
            Year climbed
          </label>
          <input
            id={`climbed-year-${hill.id}`}
            type="number"
            name="climbedYear"
            inputMode="numeric"
            required
            min={EARLIEST_YEAR}
            max={Number(latest.slice(0, 4))}
            placeholder="e.g. 2015"
            defaultValue={ascent?.climbed.precision === "year" ? ascent.climbed.year : undefined}
            className={`${field} w-32`}
          />
        </div>
      )}

      {precision === "unknown" && (
        <p className="text-sm text-muted">It&apos;ll count as climbed, without a date.</p>
      )}

      <div>
        <label htmlFor={`notes-${hill.id}`} className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(only you can see these)</span>
        </label>
        <textarea
          id={`notes-${hill.id}`}
          name="notes"
          rows={2}
          maxLength={MAX_NOTES}
          defaultValue={ascent?.notes ?? ""}
          placeholder="Route, weather, who you went with…"
          className={`${field} block w-full`}
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
        {ascent && (
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
