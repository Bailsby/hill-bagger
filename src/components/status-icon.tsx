export function StatusIcon({ climbed }: { climbed: boolean }) {
  return climbed ? (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-brand" fill="currentColor" role="img" aria-label="Climbed">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 size-5 shrink-0 text-line"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      role="img"
      aria-label="Not yet climbed"
    >
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}
