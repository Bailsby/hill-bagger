"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/**
 * A dropdown whose options open attached to the box, styled to match the site.
 * A native <select> can't do that: browsers draw its list as a separate
 * pop-up, with its own gap and corners. This follows the WAI-ARIA "select-only
 * combobox" pattern, so it works from the keyboard and reads like a select to
 * screen readers.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className = "",
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  /** Read out by screen readers in place of a visible label. */
  label: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex(([v]) => v === value));
  const selectedLabel = options[selectedIndex]?.[1] ?? "";

  // Clicking anywhere else closes it, like a native select.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option[0]);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    const move = (index: number) => {
      event.preventDefault();
      if (open) setActive(Math.min(last, Math.max(0, index)));
      else show();
    };
    switch (event.key) {
      case "ArrowDown":
        return move(active + 1);
      case "ArrowUp":
        return move(active - 1);
      case "Home":
        return move(0);
      case "End":
        return move(last);
      case "Enter":
      case " ":
        event.preventDefault();
        return open ? choose(active) : show();
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      case "Tab":
        if (open) choose(active);
        return;
      default:
        // Typing a letter jumps to the first option starting with it.
        if (event.key.length === 1) {
          const match = options.findIndex(([, text]) => text.toLowerCase().startsWith(event.key.toLowerCase()));
          if (match >= 0) {
            if (open) setActive(match);
            else onChange(options[match][0]);
          }
        }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 border border-line bg-surface px-3 py-2 text-left text-sm outline-none transition-[border-radius] focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 ${
          open ? "rounded-t-lg border-b-transparent" : "rounded-lg"
        }`}
      >
        <span className="whitespace-nowrap">{selectedLabel}</span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 -mt-px origin-top overflow-hidden rounded-b-lg border border-t-0 border-line bg-surface py-1 shadow-md transition-[opacity,transform] duration-150 starting:-translate-y-1 starting:opacity-0"
      >
        {options.map(([optionValue, text], index) => (
          <li
            key={optionValue}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={optionValue === value}
            onPointerEnter={() => setActive(index)}
            // pointerdown, so choosing doesn't blur the button first.
            onPointerDown={(event) => {
              event.preventDefault();
              choose(index);
            }}
            className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm whitespace-nowrap ${
              index === active ? "bg-brand-soft" : ""
            } ${optionValue === value ? "font-medium text-brand-strong" : ""}`}
          >
            {text}
            {optionValue === value && (
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 text-brand">
                <path d="M5 10.5l3.5 3.5L15 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
