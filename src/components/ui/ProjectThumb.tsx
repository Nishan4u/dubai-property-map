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
  const logoBadge = logoUrl ? (
    <div
      className={clsx(
        "absolute overflow-hidden rounded-md border-2 border-white/90 bg-navy-900/40 shadow-md backdrop-blur-sm",
        logoSize === "sm" && "bottom-1 left-1 h-4 w-4",
        logoSize === "md" && "bottom-1.5 left-1.5 h-6 w-6",
        logoSize === "lg" && "bottom-3 left-3 h-12 w-12 rounded-lg"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" className="h-full w-full object-contain" />
    </div>
  ) : null;

  if (imageUrl) {
    return (
      <div className={clsx("relative overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        {logoBadge}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
    >
      <Building2 className="h-8 w-8 text-white/25" strokeWidth={1.5} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
      {logoBadge}
    </div>
  );
}
