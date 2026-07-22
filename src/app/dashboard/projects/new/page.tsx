import { ProjectForm } from "@/components/dashboard/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Add Project</h1>
        <p className="text-sm text-ink-400">
          Fill in your project details for review and publishing.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
