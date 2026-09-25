import type { Metadata } from "next";
import Link from "next/link";
import { HillMap } from "@/components/hill-map";
import { HOME_TIME_ZONE, todayIn } from "@/lib/dates";
import { hillLists, hills, listsContaining } from "@/lib/hills";
import type { MapHill } from "@/lib/map-view";
import { getProgress } from "@/lib/progress";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Map" };

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { ascents, canEdit } = await getProgress();

  // `/map?list=wainwrights` opens on one list; anything else shows them all.
  const listParam = firstParam((await searchParams).list);
  const requested = hillLists.find((list) => list.id === listParam);
  const initialLists = requested ? [requested.id] : hillLists.map((list) => list.id);

  const mapHills: MapHill[] = hills.map((hill) => {
    const ascent = ascents.get(hill.id);
    return {
      ...hill,
      listIds: listsContaining(hill.id).map((list) => list.id),
      ascent: ascent ? { climbed: ascent.climbed, notes: ascent.notes } : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← All lists
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Map</h1>
      <p className="mt-2 text-muted">
        Every summit on the six lists. Choose which lists to show, and select a summit for its details.
      </p>

      <div className="mt-6">
        <HillMap
          hills={mapHills}
          lists={hillLists.map(({ id, name }) => ({ id, name }))}
          initialLists={initialLists}
          canEdit={canEdit}
          today={todayIn(HOME_TIME_ZONE)}
          osApiKey={process.env.OS_MAPS_API_KEY?.trim() || null}
        />
      </div>
    </main>
  );
}
