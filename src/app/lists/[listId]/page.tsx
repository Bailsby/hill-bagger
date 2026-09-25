import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HillList } from "@/components/hill-list";
import { ProgressBar } from "@/components/progress-bar";
import { HOME_TIME_ZONE, todayIn } from "@/lib/dates";
import { hillLists, hillsById, listProgress, listsContaining } from "@/lib/hills";
import type { ListRow } from "@/lib/list-view";
import { getProgress } from "@/lib/progress";

// Only the six lists exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return hillLists.map((list) => ({ listId: list.id }));
}

const findList = (listId: string) => hillLists.find((list) => list.id === listId);

export async function generateMetadata({ params }: PageProps<"/lists/[listId]">): Promise<Metadata> {
  return { title: findList((await params).listId)?.name ?? "List" };
}

export default async function ListPage({ params }: PageProps<"/lists/[listId]">) {
  const list = findList((await params).listId);
  if (!list) notFound();

  const { ascents, canEdit } = await getProgress();
  const rows: ListRow[] = list.hillIds.flatMap((id) => {
    const hill = hillsById.get(id);
    if (!hill) return [];
    const ascent = ascents.get(id);
    return [
      {
        ...hill,
        alsoOn: listsContaining(id)
          .filter((other) => other.id !== list.id)
          .map((other) => ({ id: other.id, name: other.name })),
        ascent: ascent ? { climbed: ascent.climbed, notes: ascent.notes } : null,
      },
    ];
  });
  const { done, total } = listProgress(list, new Set(ascents.keys()));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← All lists
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{list.name}</h1>
        <span className="text-muted">{list.region}</span>
      </div>
      <p className="mt-2 max-w-2xl text-muted">{list.description}</p>
      <Link
        href={`/map?list=${list.id}`}
        className="mt-2 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline"
      >
        View on a map →
      </Link>

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <ProgressBar done={done} total={total} label={`${list.name} climbed`} size="lg" />
      </div>

      <div className="mt-8">
        <HillList rows={rows} canEdit={canEdit} today={todayIn(HOME_TIME_ZONE)} />
      </div>
    </main>
  );
}
