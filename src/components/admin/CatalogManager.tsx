"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

interface CatalogItem {
  id: string;
  name: string;
  sort_order: number;
}

function CatalogSection({
  title,
  singular,
  table,
  items: initialItems,
}: {
  title: string;
  singular: string;
  table: "property_types" | "amenities";
  items: CatalogItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ name: name.trim(), sort_order: items.length + 1 })
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data]);
      await logAudit(`${table}.created`, table, data.id, { name: name.trim() });
      setName("");
    }
    setSaving(false);
  }

  async function handleDelete(item: CatalogItem) {
    if (!confirm(`Remove "${item.name}"?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", item.id);
    await logAudit(`${table}.deleted`, table, item.id, { name: item.name });
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="mb-3 text-sm font-semibold text-ink-100">{title}</p>
      <ul className="mb-3 space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
          >
            <span className="text-ink-200">{item.name}</span>
            <button
              onClick={() => handleDelete(item)}
              className="text-ink-500 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-ink-500">None added yet.</p>
        )}
      </ul>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`Add ${singular}…`}
          className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

export function CatalogManager({
  propertyTypes,
  amenities,
}: {
  propertyTypes: CatalogItem[];
  amenities: CatalogItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <CatalogSection title="Property Types" singular="a property type" table="property_types" items={propertyTypes} />
      <CatalogSection title="Amenities" singular="an amenity" table="amenities" items={amenities} />
    </div>
  );
}
