import Link from "next/link";
import { Heart, Search } from "lucide-react";

const secondaryLinks = [
  { label: "Developers", href: "/developers" },
  { label: "Communities", href: "/communities" },
  { label: "Blog", href: "/blog" },
  { label: "Compare", href: "/compare" },
  { label: "Advertise", href: "/advertise" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="border-b border-navy-700 bg-navy-900">
        <header className="flex items-center gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 font-bold text-navy-950">
              D
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink-100">Dubai</div>
              <div className="text-[10px] font-medium tracking-widest text-gold-400">
                PROPERTY MAP
              </div>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 lg:flex">
            <Search className="h-4 w-4 shrink-0 text-ink-500" />
            <input
              className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              placeholder="Search projects, communities or developers..."
            />
          </div>

          <Link
            href="/favorites"
            className="hidden shrink-0 items-center justify-center rounded-lg border border-navy-700 p-2 text-ink-300 hover:text-ink-100 lg:flex"
          >
            <Heart className="h-4 w-4" />
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Login / Register
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              List Your Property
            </Link>
          </div>
        </header>
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-navy-800/80 px-6 py-2 text-xs font-medium text-ink-400">
          {secondaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 hover:text-ink-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-navy-800 px-6 py-6 text-center text-xs text-ink-500">
        © 2026 Dubai Property Map. Prototype build — data shown is illustrative.
      </footer>
    </div>
  );
}
