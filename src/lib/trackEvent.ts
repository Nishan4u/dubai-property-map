"use client";

import { createClient } from "@/lib/supabase/client";

export type ProjectEventType = "click" | "whatsapp" | "phone" | "map_click";

// Fire-and-forget: real engagement tracking shouldn't block or break the UI
// if it fails, so callers don't need to await or handle errors.
export function trackProjectEvent(projectId: string, eventType: ProjectEventType) {
  const supabase = createClient();
  supabase.from("project_events").insert({ project_id: projectId, event_type: eventType });
}
