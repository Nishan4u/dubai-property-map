import { clsx } from "clsx";
import { Building2 } from "lucide-react";

export function ProjectThumb({
  gradient,
  imageUrl,
  logoUrl,
  logoSize = "md",
  className,
}: {
  gradient: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  logoSize?: "sm" | "md" | "lg";
  className?: string;
}) {
  // Deliberately hangs slightly below the thumbnail's own bottom edge (a
  // negative offset) rather than sitting fully inside it, so it needs to
  // live outside the image's own overflow-hidden clipping -- hence the
  // image being wrapped in its own inset-0 layer below instead of putting
  // overflow-hidden on the outer (badge-containing) element.
  const logoBadge = logoUrl ? (
    <div
      className={clsx(
        "absolute z-10 overflow-hidden rounded-md border-2 border-white/90 bg-navy-900/40 shadow-md backdrop-blur-sm",
        logoSize === "sm" && "bottom-1 left-1 h-4 w-4",
        logoSize === "md" && "bottom-1.5 left-1.5 h-6 w-6",
        logoSize === "lg" && "-bottom-2 left-3 h-12 w-12 rounded-lg"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" className="h-full w-full object-contain" />
    </div>
  ) : null;

  if (imageUrl) {
    return (
      <div className={clsx("relative", className)}>
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        {logoBadge}
      </div>
    );
  }

  return (
    <div className={clsx("relative", className)}>
      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] bg-gradient-to-br",
          gradient
        )}
      >
        <Building2 className="h-8 w-8 text-white/25" strokeWidth={1.5} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>
      {logoBadge}
    </div>
  );
}
