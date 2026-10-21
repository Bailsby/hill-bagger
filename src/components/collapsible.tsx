"use client";

import { useEffect, useState, type ReactNode } from "react";

// A little longer than the CSS transition, so the close animation finishes
// before the content is removed.
const CLOSE_MS = 320;

/**
 * Slides content open and closed. Animating grid-template-rows between 0fr
 * and 1fr lets it ease to the content's natural height without measuring it.
 * The content mounts when opened (animated in with @starting-style) and stays
 * mounted just long enough to animate out, so a closed row doesn't keep a
 * form around. Reduced-motion users get it instantly.
 */
export function Collapsible({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  // Mount as soon as it opens; adjusting state during render avoids an extra pass.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  if (!mounted) return null;
  return (
    <div
      id={id}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0" : "grid-rows-[0fr] opacity-0"
      }`}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
