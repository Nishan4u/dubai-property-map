import Link from "next/link";
import type { Developer } from "@/types";

export function PartnerDevelopersSlider({
  developers,
}: {
  developers: Developer[];
}) {
  if (developers.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly at -50% translate.
  const track = [...developers, ...developers];

  return (
    <div className="overflow-hidden border-t border-navy-800 bg-navy-900 px-4 py-2">
      <div className="flex w-max animate-marquee items-center gap-8">
        {track.map((dev, i) => (
          <Link
            key={`${dev.id}-${i}`}
            href={`/developers/${dev.slug}`}
            title={dev.name}
            className="flex shrink-0 items-center gap-2 opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
          >
            <span className="flex items-center gap-1.5">
              {dev.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dev.logoUrl}
                  alt={dev.name}
                  className="h-6 w-6 shrink-0 rounded-md object-contain"
                />
              ) : (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                  style={{ background: dev.color }}
                >
                  {dev.initial}
                </span>
              )}
              <span className="whitespace-nowrap text-xs font-medium text-ink-300">
                {dev.name}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
