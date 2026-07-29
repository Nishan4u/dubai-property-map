// Generic, non-identifying placeholder cards -- shown instead of a blank
// "0 results" state when the real catalogue was withheld from an
// unauthorized viewer (see ProjectAccessGate), so the blur-and-overlay
// treatment has an actual grid of cards to blur rather than empty space.
export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-navy-700 bg-navy-850 p-3"
        >
          <div className="h-24 w-28 shrink-0 rounded-lg bg-navy-800" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-3.5 w-3/4 rounded bg-navy-800" />
            <div className="h-3 w-1/2 rounded bg-navy-800" />
            <div className="h-3 w-2/5 rounded bg-navy-800" />
            <div className="h-3.5 w-1/3 rounded bg-navy-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
