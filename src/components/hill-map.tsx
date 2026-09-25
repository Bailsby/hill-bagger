"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ListId } from "@/data/hill-data";
import type { CalendarDate } from "@/lib/dates";
import { formatGridRef, formatHeight } from "@/lib/format";
import type { Show } from "@/lib/list-view";
import {
  GB_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  OS_MIN_NATIVE_ZOOM,
  boundsOf,
  filterMapHills,
  osAttribution,
  osTileUrl,
  searchHills,
  type MapHill,
} from "@/lib/map-view";
import { AscentEditor } from "./ascent-editor";
import { ClimbDateLabel } from "./climb-date-label";

// Leaflet paints markers on a canvas, so colours are literal values. They match
// --color-brand and --color-ink in globals.css.
const CLIMBED = "#2f5d46";
const NOT_YET = "#1d2a22";

// OS tiles stop a little way offshore. Filling the rest with OS's own sea colour
// hides the edge when zoomed out; Leaflet's stylesheet would otherwise paint it grey.
const OS_SEA = "#a9ddef";
const NO_TILES = "#e8ece4";

const showOptions: [Show, string][] = [
  ["all", "All"],
  ["todo", "Not yet"],
  ["done", "Climbed"],
];

type ListOption = { id: ListId; name: string };

export function HillMap({
  hills,
  lists,
  initialLists,
  canEdit,
  today,
  osApiKey,
}: {
  hills: MapHill[];
  lists: ListOption[];
  initialLists: ListId[];
  canEdit: boolean;
  today: CalendarDate;
  osApiKey: string | null;
}) {
  const [chosen, setChosen] = useState<ReadonlySet<ListId>>(() => new Set(initialLists));
  const [show, setShow] = useState<Show>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.LayerGroup | null>(null);
  const lastFitRef = useRef<string | null>(null);

  const visible = useMemo(() => filterMapHills(hills, { lists: chosen, show }), [hills, chosen, show]);
  const climbedCount = visible.filter((hill) => hill.ascent !== null).length;
  const selected = hills.find((hill) => hill.id === selectedId) ?? null;
  const results = useMemo(() => searchHills(visible, query), [visible, query]);
  const selectedLists = selected ? lists.filter((list) => selected.listIds.includes(list.id)) : [];

  // Create the map once. Leaflet needs `window`, so it's imported here rather
  // than at the top, keeping it out of the server render.
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | undefined;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current, {
        preferCanvas: true,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: GB_BOUNDS,
        maxBoundsViscosity: 1,
      });
      map.fitBounds(GB_BOUNDS);
      if (osApiKey) {
        L.tileLayer(osTileUrl(osApiKey), {
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          minNativeZoom: OS_MIN_NATIVE_ZOOM,
          maxNativeZoom: MAX_ZOOM,
          attribution: osAttribution(new Date().getFullYear()),
        }).addTo(map);
      }
      leafletRef.current = L;
      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
      setReady(true);
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markersRef.current = null;
      lastFitRef.current = null;
    };
  }, [osApiKey]);

  // Redraw the markers whenever what's shown, or what's selected, changes.
  useEffect(() => {
    const L = leafletRef.current;
    const layer = markersRef.current;
    if (!ready || !L || !layer) return;

    layer.clearLayers();
    // The selected summit last, so it's drawn on top of its neighbours.
    const ordered = [...visible].sort(
      (a, b) => Number(a.id === selectedId) - Number(b.id === selectedId),
    );
    ordered.forEach((hill) => {
      const climbed = hill.ascent !== null;
      const isSelected = hill.id === selectedId;
      L.circleMarker([hill.lat, hill.lng], {
        radius: isSelected ? 9 : 6,
        weight: isSelected ? 3 : 1.5,
        color: climbed ? CLIMBED : NOT_YET,
        fillColor: climbed ? CLIMBED : "#ffffff",
        fillOpacity: 0.9,
      })
        .bindTooltip(hill.name, { direction: "top", offset: [0, -8] })
        .on("click", () => {
          setSelectedId(hill.id);
          setEditing(false);
        })
        .addTo(layer);
    });
  }, [ready, visible, selectedId]);

  // Frame the summits when the filters change — but not after every save,
  // which would yank the view away from where you're working.
  const fitKey = `${[...chosen].sort().join(",")}|${show}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || lastFitRef.current === fitKey) return;
    lastFitRef.current = fitKey;
    map.fitBounds(boundsOf(visible) ?? GB_BOUNDS, { padding: [32, 32], maxZoom: 12 });
  }, [ready, fitKey, visible]);

  const toggleList = (id: ListId) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectFromSearch = (hill: MapHill) => {
    setSelectedId(hill.id);
    setEditing(false);
    setQuery("");
    const map = mapRef.current;
    map?.flyTo([hill.lat, hill.lng], Math.max(map.getZoom(), 12), { duration: 0.8 });
  };

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lists shown">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              aria-pressed={chosen.has(list.id)}
              onClick={() => toggleList(list.id)}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-brand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white"
            >
              {list.name}
            </button>
          ))}
          {chosen.size < lists.length && (
            <button
              type="button"
              onClick={() => setChosen(new Set(lists.map((list) => list.id)))}
              className="px-2 py-1 text-sm text-brand underline-offset-2 hover:underline"
            >
              All lists
            </button>
          )}
        </div>
        <fieldset className="flex self-start rounded-lg border border-line bg-surface p-0.5">
          <legend className="sr-only">Show</legend>
          {showOptions.map(([value, label]) => (
            <label
              key={value}
              className="rounded-md px-3 py-1.5 text-sm has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
            >
              <input
                type="radio"
                name="map-show"
                value={value}
                checked={show === value}
                onChange={() => setShow(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>

      {!osApiKey && (
        <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm">
          The OS map isn&apos;t configured (<code className="font-mono">OS_MAPS_API_KEY</code>), so
          summits are shown without a background map.
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div
          ref={containerRef}
          role="region"
          aria-label="Map of summits"
          className="h-[65vh] min-h-96 overflow-hidden rounded-xl border border-line"
          style={{ background: osApiKey ? OS_SEA : NO_TILES }}
        />

        <aside className="rounded-xl border border-line bg-surface p-4">
          <label htmlFor="map-search" className="text-sm font-medium">
            Find a hill
          </label>
          <input
            id="map-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Helvellyn"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {query.trim() !== "" && (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">No summits shown match.</li>
              ) : (
                results.map((hill) => (
                  <li key={hill.id}>
                    <button
                      type="button"
                      onClick={() => selectFromSearch(hill)}
                      className="flex w-full justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-brand-soft"
                    >
                      <span>{hill.name}</span>
                      <span className="shrink-0 text-muted tabular-nums">{Math.round(hill.metres)} m</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="mt-5 border-t border-line pt-4">
            {selected ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{selected.name}</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close"
                    className="-mr-1 -mt-1 rounded px-2 text-lg leading-none text-muted hover:text-ink"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatHeight(selected.metres)}
                  <br />
                  {selected.area} · <span className="whitespace-nowrap font-mono text-xs">{formatGridRef(selected.gridRef)}</span>
                </p>
                <p className="mt-2 flex flex-wrap gap-1 text-xs">
                  {selectedLists.map((list) => (
                    <span key={list.id} className="rounded-full bg-brand-soft px-2 py-0.5 text-brand-strong">
                      {list.name}
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-sm">
                  {selected.ascent ? (
                    <>
                      Climbed:{" "}
                      <ClimbDateLabel climbed={selected.ascent.climbed} className="font-medium text-brand" />
                    </>
                  ) : (
                    <span className="text-muted">Not climbed yet</span>
                  )}
                </p>
                {canEdit && selected.ascent?.notes && (
                  <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{selected.ascent.notes}</p>
                )}
                {canEdit &&
                  (editing ? (
                    <div className="mt-3">
                      <AscentEditor
                        key={selected.id}
                        hill={selected}
                        ascent={selected.ascent}
                        today={today}
                        onClose={() => setEditing(false)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
                    >
                      {selected.ascent ? "Edit climb" : "Mark climbed"}
                    </button>
                  ))}
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-muted">Select a summit on the map, or find one by name.</p>
                <ul className="mt-3 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="size-3 rounded-full border-[1.5px] border-brand bg-brand" aria-hidden="true" />
                    Climbed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-3 rounded-full border-[1.5px] border-ink bg-white" aria-hidden="true" />
                    Not yet
                  </li>
                </ul>
              </div>
            )}
          </div>

          <p className="mt-5 border-t border-line pt-3 text-sm text-muted" aria-live="polite">
            {visible.length} summits shown · {climbedCount} climbed
          </p>
        </aside>
      </div>
    </div>
  );
}
