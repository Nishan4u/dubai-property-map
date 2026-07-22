import { clsx } from "clsx";

const tones = {
  neutral: "bg-navy-700 text-ink-300",
  gold: "bg-gold-500/15 text-gold-400 border border-gold-500/30",
  green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  red: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  blue: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  purple: "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
