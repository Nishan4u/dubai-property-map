import { Heart } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCard } from "@/components/public/ProjectCard";
import { projects } from "@/data/mock";

export default function FavoritesPage() {
  const saved = projects.slice(0, 3);
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-100">
          <Heart className="h-6 w-6 text-rose-400" /> Your Favorites
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Sample saved projects — persistence isn&apos;t wired up in this
          prototype yet.
        </p>
        <div className="mt-6 space-y-3">
          {saved.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
