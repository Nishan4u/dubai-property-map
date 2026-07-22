import { clsx } from "clsx";
import { Building2 } from "lucide-react";

export function ProjectThumb({
  gradient,
  className,
}: {
  gradient: string;
  className?: string;
}) {
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
    </div>
  );
}
