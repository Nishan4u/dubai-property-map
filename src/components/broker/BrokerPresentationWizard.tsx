"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAed } from "@/data/mock";
import type { ClientPropertyRequestSignal, CrmClientRow } from "@/lib/supabase/queries";
import type { ProjectWithRelations } from "@/types/database";

const STEP_LABELS = ["Client", "Projects", "Units", "Review & Create"];

// Real-data matching only -- no AI call, nothing invented. A client's
// linked property_requests row (if any) ties them to one specific
// project they already showed interest in, plus budget/bedroom/
// property-type criteria used only to suggest real complementary
// alternatives -- never a fabricated recommendation.
function projectMatchesSignal(project: ProjectWithRelations, signal: ClientPropertyRequestSignal): boolean {
  if (signal.budgetMaxAed != null && project.price_from_aed > signal.budgetMaxAed * 1.3) return false;
  if (signal.budgetMinAed != null && project.price_from_aed < signal.budgetMinAed * 0.5) return false;
  if (signal.bedroomsNum != null && project.bedrooms_from != null && project.bedrooms_to != null) {
    if (signal.bedroomsNum < project.bedrooms_from || signal.bedroomsNum > project.bedrooms_to) return false;
  }
  if (signal.propertyType && project.property_type && signal.propertyType !== project.property_type) return false;
  return true;
}

// New, parallel page to the plain "New Collection" form in
// BrokerCollectionsClient.tsx (completely untouched by this component) --
// a guided 4-step alternative over the exact same crm_collections/
// crm_collection_items data. Broker portal only this pass; the identical
// pattern is a cheap fast-follow for salesperson/developer/broker-agency
// once this one's proven.
export function BrokerPresentationWizard({
  brokerId,
  clients,
  projects,
  latestRequestByClient,
}: {
  brokerId: string;
  clients: CrmClientRow[];
  projects: ProjectWithRelations[];
  latestRequestByClient: Record<string, ClientPropertyRequestSignal>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [autoMatchNote, setAutoMatchNote] = useState<string | null>(null);
  const [filterBudgetMin, setFilterBudgetMin] = useState("");
  const [filterBudgetMax, setFilterBudgetMax] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterCommunity, setFilterCommunity] = useState("");
  // Empty/absent array for a project = "show all its unit types", the
  // exact same null-means-all semantics the DB column uses -- this step
  // is fully skippable with zero change in outcome.
  const [selectedUnitTypesByProject, setSelectedUnitTypesByProject] = useState<Record<string, string[]>>({});
  const [title, setTitle] = useState("");
  const [hideDeveloperName, setHideDeveloperName] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);
  const [mode, setMode] = useState("default");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const communities = useMemo(
    () => [...new Set(projects.map((p) => p.communities?.name).filter((v): v is string => Boolean(v)))].sort(),
    [projects]
  );

  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterBudgetMin && p.price_from_aed < Number(filterBudgetMin)) return false;
      if (filterBudgetMax && p.price_from_aed > Number(filterBudgetMax)) return false;
      if (filterBedrooms) {
        const n = Number(filterBedrooms);
        if (p.bedrooms_from == null || p.bedrooms_to == null || n < p.bedrooms_from || n > p.bedrooms_to) return false;
      }
      if (filterCommunity && p.communities?.name !== filterCommunity) return false;
      return true;
    });
  }, [projects, filterBudgetMin, filterBudgetMax, filterBedrooms, filterCommunity]);

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function toggleUnitType(projectId: string, unitTypeId: string) {
    setSelectedUnitTypesByProject((prev) => {
      const current = prev[projectId] ?? [];
      const next = current.includes(unitTypeId) ? current.filter((x) => x !== unitTypeId) : [...current, unitTypeId];
      return { ...prev, [projectId]: next };
    });
  }

  // Runs once, only when leaving step 1 -- going back and forward again
  // without changing the client never resets a broker's manual picks.
  function goToProjectsStep() {
    const signal = clientId ? latestRequestByClient[clientId] : undefined;
    if (signal) {
      const matchedIds: string[] = [];
      if (projects.some((p) => p.id === signal.requestedProjectId)) {
        matchedIds.push(signal.requestedProjectId);
      }
      for (const p of projects) {
        if (matchedIds.length >= 8) break;
        if (matchedIds.includes(p.id)) continue;
        if (projectMatchesSignal(p, signal)) matchedIds.push(p.id);
      }
      setSelectedProjectIds(matchedIds);
      const client = clients.find((c) => c.id === clientId);
      const parts: string[] = [];
      if (signal.budgetMinAed != null || signal.budgetMaxAed != null) {
        parts.push(
          `AED ${signal.budgetMinAed != null ? Math.round(signal.budgetMinAed).toLocaleString() : "0"}–${
            signal.budgetMaxAed != null ? Math.round(signal.budgetMaxAed).toLocaleString() : "any"
          }`
        );
      }
      if (signal.bedroomsNum != null) parts.push(`${signal.bedroomsNum} bed`);
      if (signal.propertyType) parts.push(signal.propertyType);
      setAutoMatchNote(
        `Matched from ${client?.full_name ?? "this client"}'s request${parts.length ? `: ${parts.join(", ")}` : ""}. Review and adjust before continuing.`
      );
    } else {
      setAutoMatchNote(null);
    }
    setStep(2);
  }

  async function handleCreate() {
    if (!title.trim() || selectedProjectIds.length === 0) return;
    setSaving(true);
    setError("");
    const supabase = createClient();

    const basePayload = {
      owner_type: "broker",
      broker_id: brokerId,
      client_id: clientId || null,
      title: title.trim(),
    };
    const hidePayload = { hide_developer_name: hideDeveloperName, hide_price: hidePrice, hide_location: hideLocation };

    // Same 3-tier fallback as BrokerCollectionsClient.handleCreate --
    // mode (patch_141) and hide_* (patch_134) may not be migrated on
    // every environment yet.
    let { data: collection, error: collectionError } = await supabase
      .from("crm_collections")
      .insert({ ...basePayload, ...hidePayload, mode })
      .select("id")
      .single();
    if (collectionError) {
      ({ data: collection, error: collectionError } = await supabase
        .from("crm_collections")
        .insert({ ...basePayload, ...hidePayload })
        .select("id")
        .single());
    }
    if (collectionError) {
      ({ data: collection, error: collectionError } = await supabase
        .from("crm_collections")
        .insert(basePayload)
        .select("id")
        .single());
    }
    if (collectionError || !collection) {
      setError(collectionError?.message ?? "Could not create the collection.");
      setSaving(false);
      return;
    }

    const fullItems = selectedProjectIds.map((projectId, i) => ({
      collection_id: collection.id,
      project_id: projectId,
      sort_order: i,
      selected_unit_type_ids: selectedUnitTypesByProject[projectId]?.length ? selectedUnitTypesByProject[projectId] : null,
    }));
    let { error: itemsError } = await supabase.from("crm_collection_items").insert(fullItems);
    if (itemsError) {
      // selected_unit_type_ids (patch_144) may not be migrated yet --
      // retry without it rather than losing the whole collection.
      const baseItems = selectedProjectIds.map((projectId, i) => ({
        collection_id: collection.id,
        project_id: projectId,
        sort_order: i,
      }));
      ({ error: itemsError } = await supabase.from("crm_collection_items").insert(baseItems));
    }
    if (itemsError) {
      setError(itemsError.message);
      setSaving(false);
      return;
    }

    router.push("/broker/collections");
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                step === i + 1
                  ? "bg-gold-500 text-navy-950"
                  : step > i + 1
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-navy-800 text-ink-500"
              }`}
            >
              {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={step === i + 1 ? "font-medium text-ink-100" : "text-ink-500"}>{label}</span>
            {i < STEP_LABELS.length - 1 && <span className="mx-1 text-ink-700">—</span>}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300">{error}</p>
      )}

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-100">Who is this presentation for?</h2>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              <option value="">No client yet -- build it manually</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                  {latestRequestByClient[c.id] ? " (has a linked request)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-500">
              If this client has a linked property request, the next step suggests matching projects automatically
              -- you can still add or remove any of them.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink-100">Pick projects ({selectedProjectIds.length} selected)</h2>
            {autoMatchNote && (
              <p className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">{autoMatchNote}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                placeholder="Min budget (AED)"
                value={filterBudgetMin}
                onChange={(e) => setFilterBudgetMin(e.target.value)}
                className="w-36 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max budget (AED)"
                value={filterBudgetMax}
                onChange={(e) => setFilterBudgetMax(e.target.value)}
                className="w-36 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <select
                value={filterBedrooms}
                onChange={(e) => setFilterBedrooms(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 focus:outline-none"
              >
                <option value="">Any bedrooms</option>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Studio" : `${n} bed`}
                  </option>
                ))}
              </select>
              <select
                value={filterCommunity}
                onChange={(e) => setFilterCommunity(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 focus:outline-none"
              >
                <option value="">Any community</option>
                {communities.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-lg border border-navy-600 bg-navy-800 p-2">
              {visibleProjects.length === 0 && <p className="p-3 text-xs text-ink-500">No projects match these filters.</p>}
              {visibleProjects.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-200 hover:bg-navy-700"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="shrink-0 accent-gold-500"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink-100">{p.name}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {p.communities?.name ?? "—"} · {p.developers?.name ?? "—"} ·{" "}
                        {p.bedrooms_from === p.bedrooms_to ? `${p.bedrooms_from} bed` : `${p.bedrooms_from}-${p.bedrooms_to} bed`}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-gold-400">from {formatAed(p.price_from_aed)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink-100">Pick unit types (optional)</h2>
            <p className="text-xs text-ink-500">
              Leave every box unchecked for a project to show all of its unit types -- exactly like today&apos;s
              plain presentations. Check specific ones to show only those.
            </p>
            {selectedProjectIds.map((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              if (!project) return null;
              const unitTypes = project.project_unit_types ?? [];
              return (
                <div key={projectId} className="rounded-lg border border-navy-600 bg-navy-800 p-3">
                  <p className="mb-2 text-sm font-medium text-ink-100">{project.name}</p>
                  {unitTypes.length === 0 ? (
                    <p className="text-xs text-ink-500">No unit types configured -- nothing to narrow down here.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {unitTypes.map((u) => (
                        <label key={u.id} className="flex items-center gap-2 text-xs text-ink-300">
                          <input
                            type="checkbox"
                            checked={(selectedUnitTypesByProject[projectId] ?? []).includes(u.id)}
                            onChange={() => toggleUnitType(projectId, u.id)}
                            className="accent-gold-500"
                          />
                          {u.unit_name} — {u.bedrooms != null ? `${u.bedrooms}BR` : u.unit_type}
                          {u.size_sqft ? `, ${u.size_sqft.toLocaleString()} sqft` : ""}
                          {u.starting_price_aed ? `, from ${formatAed(u.starting_price_aed)}` : ""}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink-100">Review &amp; create</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Villas shortlist for the Khan family"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Hide info to prompt engagement (optional)</label>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-navy-600 bg-navy-800 p-2.5">
                <label className="flex items-center gap-1.5 text-xs text-ink-200">
                  <input
                    type="checkbox"
                    checked={hideDeveloperName}
                    onChange={(e) => setHideDeveloperName(e.target.checked)}
                    className="accent-gold-500"
                  />
                  Hide developer name
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-200">
                  <input type="checkbox" checked={hidePrice} onChange={(e) => setHidePrice(e.target.checked)} className="accent-gold-500" />
                  Hide price
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-200">
                  <input
                    type="checkbox"
                    checked={hideLocation}
                    onChange={(e) => setHideLocation(e.target.checked)}
                    className="accent-gold-500"
                  />
                  Hide location
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Presentation mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
              >
                <option value="default">Default -- everything, natural order</option>
                <option value="investor">Investor -- pricing &amp; payment plan first</option>
                <option value="end_user">End User -- location &amp; lifestyle first</option>
                <option value="quick_pitch">Quick Pitch -- projects only, no extra sections</option>
                <option value="luxury">Luxury -- premium specs &amp; lifestyle, understated pricing</option>
              </select>
            </div>
            <div className="rounded-lg border border-navy-600 bg-navy-800 p-3">
              <p className="mb-1.5 text-xs font-medium text-ink-400">
                {selectedProjectIds.length} project{selectedProjectIds.length === 1 ? "" : "s"} selected
              </p>
              <ul className="space-y-1 text-xs text-ink-300">
                {selectedProjectIds.map((id) => {
                  const project = projects.find((p) => p.id === id);
                  const picked = selectedUnitTypesByProject[id]?.length ?? 0;
                  const total = project?.project_unit_types?.length ?? 0;
                  return (
                    <li key={id}>
                      {project?.name ?? id} — {picked > 0 ? `${picked} of ${total} unit types` : "all unit types"}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100 disabled:opacity-40"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => (step === 1 ? goToProjectsStep() : setStep((s) => s + 1))}
            disabled={step === 2 && selectedProjectIds.length === 0}
            className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !title.trim() || selectedProjectIds.length === 0}
            className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create Presentation"}
          </button>
        )}
      </div>
    </div>
  );
}
