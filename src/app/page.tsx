import Link from "next/link";
import { ClimbDateLabel } from "@/components/climb-date-label";
import { ProgressBar } from "@/components/progress-bar";
import { isDated } from "@/lib/climb-date";
import { formatHeight } from "@/lib/format";
import { hillLists, hillsById, listProgress, listsContaining } from "@/lib/hills";
import { getProgress } from "@/lib/progress";

const RECENT = 8;

export default async function Home() {
  const { ownerName, ascents, history, canEdit } = await getProgress();
  const firstName = ownerName?.split(" ")[0];
  const climbed = new Set(ascents.keys());
  // "Latest" and "recent" only mean something for climbs with a date.
  const dated = history.filter((ascent) => isDated(ascent.climbed));
  const latest = dated[0];
  const complete = hillLists.filter((list) => {
    const { done, total } = listProgress(list, climbed);
    return done === total;
  }).length;

  return (
    <main>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {firstName ? `${firstName}’s hill bagging` : "Hill bagging"}
      </h1>
      <p className="mt-2 text-muted">
        Progress across six British hill lists. A hill on more than one list counts on each.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="text-sm text-muted">Hills climbed</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{ascents.size}</dd>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="text-sm text-muted">Lists complete</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {complete} <span className="text-base font-normal text-muted">of {hillLists.length}</span>
          </dd>
        </div>
        <div className="col-span-2 rounded-xl border border-line bg-surface p-4 sm:col-span-1">
          <dt className="text-sm text-muted">Latest</dt>
          <dd className="mt-1 font-semibold">
            {latest ? (
              <>
                {hillsById.get(latest.hillId)?.name}
                <ClimbDateLabel climbed={latest.climbed} className="block text-sm font-normal text-muted" />
              </>
            ) : (
              <span className="font-normal text-muted">{history.length > 0 ? "No dates recorded" : "Nothing yet"}</span>
            )}
          </dd>
        </div>
      </dl>

      <h2 className="mt-12 text-xl font-semibold">Lists</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {hillLists.map((list) => {
          const { done, total } = listProgress(list, climbed);
          return (
            <li key={list.id}>
              <Link
                href={`/lists/${list.id}`}
                className="block h-full rounded-xl border border-line bg-surface p-5 transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">{list.name}</h3>
                  <span className="text-sm text-muted">{list.region}</span>
                </div>
                <div className="mt-4">
                  <ProgressBar done={done} total={total} label={`${list.name} climbed`} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-12 text-xl font-semibold">Recently climbed</h2>
      {dated.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-surface p-5 text-muted">
          {history.length === 0 ? "No climbs recorded yet." : "None of the recorded climbs has a date yet."}
          {canEdit && history.length === 0 && " Open a list and mark the hills you've climbed."}
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
          {dated.slice(0, RECENT).map((ascent) => {
            const hill = hillsById.get(ascent.hillId);
            if (!hill) return null;
            return (
              <li key={ascent.hillId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
                <div>
                  <span className="font-medium">{hill.name}</span>
                  <span className="ml-2 text-sm text-muted">{formatHeight(hill.metres)}</span>
                  <span className="block text-sm text-muted">
                    {listsContaining(hill.id)
                      .map((list) => list.name)
                      .join(" · ")}
                  </span>
                </div>
                <ClimbDateLabel climbed={ascent.climbed} className="text-sm tabular-nums text-muted" />
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
