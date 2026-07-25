"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ConstructionMilestoneRow } from "@/types/database";

export function ConstructionMilestonesManager({
  projectId,
  initialProgress,
  initialMilestones,
}: {
  projectId: string;
  initialProgress: number;
  initialMilestones: ConstructionMilestoneRow[];
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [savingProgress, setSavingProgress] = useState(false);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  async function saveProgress(value: number) {
    setProgress(value);
    setSavingProgress(true);
    const supabase = createClient();
    await supabase
      .from("projects")
      .update({ construction_progress_percent: value })
      .eq("id", projectId);
    setSavingProgress(false);
    router.refresh();
  }

  async function addMilestone() {
    if (!title.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("construction_milestones")
      .insert({
        project_id: projectId,
        title: title.trim(),
        milestone_date: date || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMilestones((prev) =>
        [...prev, data].sort((a, b) =>
          (a.milestone_date ?? "").localeCompare(b.milestone_date ?? "")
        )
      );
      setTitle("");
      setDate("");
    }
  }

  async function toggleCompleted(m: ConstructionMilestoneRow) {
    setMilestones((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, completed: !x.completed } : x))
    );
    const supabase = createClient();
    await supabase
      .from("construction_milestones")
      .update({ completed: !m.completed })
      .eq("id", m.id);
  }

  async function removeMilestone(id: string) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    const supabase = createClient();
    await supabase.from("construction_milestones").delete().eq("id", id);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-ink-400">
          <span>Construction Progress</span>
          <span>{progress}%{savingProgress ? " · saving…" : ""}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => saveProgress(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
      </div>

      <div className="space-y-2">
        {milestones.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
          >
            <button
              type="button"
              onClick={() => toggleCompleted(m)}
              className="flex items-center gap-2 text-left"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  m.completed
                    ? "border-emerald-500 bg-emerald-500 text-navy-950"
                    : "border-navy-600"
                }`}
              >
                {m.completed && <Check className="h-3 w-3" />}
              </span>
              <span className={m.completed ? "text-ink-400 line-through" : "text-ink-100"}>
                {m.title}
              </span>
              {m.milestone_date && (
                <span className="text-xs text-ink-500">
                  {new Date(m.milestone_date).toLocaleDateString()}
                </span>
              )}
            </button>
            <button
              onClick={() => removeMilestone(m.id)}
              className="text-ink-500 hover:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {milestones.length === 0 && (
          <p className="text-xs text-ink-500">No milestones added yet.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          placeholder="Milestone (e.g. Foundation complete)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMilestone();
            }
          }}
          className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
        />
        <button
          type="button"
          onClick={addMilestone}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
