import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { projects } from "@/data/mock";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">{project.name}</h1>
        <p className="text-sm text-ink-400">Edit project details.</p>
      </div>
      <ProjectForm project={project} />
    </div>
  );
}

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}
