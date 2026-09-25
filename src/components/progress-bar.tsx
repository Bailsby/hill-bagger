import { formatPercent } from "@/lib/format";

export function ProgressBar({
  done,
  total,
  label,
  size = "md",
}: {
  done: number;
  total: number;
  label: string;
  size?: "md" | "lg";
}) {
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total}`}
        className={`overflow-hidden rounded-full bg-brand-soft ${size === "lg" ? "h-3" : "h-2"}`}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
        />
      </div>
      <p className={`mt-2 flex justify-between tabular-nums ${size === "lg" ? "text-base" : "text-sm"}`}>
        <span>
          <span className="font-semibold">{done}</span>
          <span className="text-muted"> of {total}</span>
        </span>
        <span className="text-muted">{formatPercent(done, total)}</span>
      </p>
    </div>
  );
}
