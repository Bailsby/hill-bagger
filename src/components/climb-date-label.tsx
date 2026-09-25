import { formatClimbDate, machineReadable, type ClimbDate } from "@/lib/climb-date";

/** A climb's date as text, marked up as a `<time>` when there is one. */
export function ClimbDateLabel({ climbed, className }: { climbed: ClimbDate; className?: string }) {
  const value = machineReadable(climbed);
  return value ? (
    <time dateTime={value} className={className}>
      {formatClimbDate(climbed)}
    </time>
  ) : (
    <span className={className}>{formatClimbDate(climbed)}</span>
  );
}
