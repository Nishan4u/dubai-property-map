"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { CoordinatesPicker } from "@/components/dashboard/CoordinatesPicker";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import type { BrokerListingRow, CommunityRow } from "@/types/database";

const fallbackPropertyTypes = ["Apartments", "Villas", "Townhouses", "Penthouse", "Office", "Retail", "Warehouse"];
const fallbackAmenities = [
  "Pool", "Gym", "Kids Area", "Cinema", "Sky Lounge", "Beach", "Golf", "Smart Home", "Parking", "Pet Friendly",
];
const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function BrokerListingForm({
  listing,
  brokerId,
  communities,
  brokerWhatsapp,
}: {
  listing?: BrokerListingRow;
  brokerId: string;
  communities: CommunityRow[];
  brokerWhatsapp: string;
}) {
  const router = useRouter();
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities ?? []);
  const [listingType, setListingType] = useState<"sale" | "rent" | "lease">(listing?.listing_type ?? "sale");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [floorPlanFiles, setFloorPlanFiles] = useState<File[]>([]);
  const [uploadPercent, setUploadPercent] = useState(0);
  // Coordinates (new -- every listing has had lat/lng null until now,
  // since nothing ever collected them). Optional: a listing without
  // coordinates behaves exactly as it always has (no map placement, no
  // location-intelligence data) -- this only adds the capture mechanism.
  const [coords, setCoords] = useState({
    lat: listing?.lat ?? DUBAI_CENTER.lat,
    lng: listing?.lng ?? DUBAI_CENTER.lng,
  });
  // CoordinatesPicker wants { name, lat, lng } with non-null lat/lng --
  // communities here is the raw CommunityRow[] (lat/lng nullable), so
  // filter out any without real coordinates rather than assuming ProjectForm's
  // already-mapped app-level Community[] shape.
  const coordCommunities = communities
    .filter((c): c is CommunityRow & { lat: number; lng: number } => c.lat != null && c.lng != null)
    .map((c) => ({ name: c.name, lat: c.lat, lng: c.lng }));

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const payload = {
      broker_id: brokerId,
      title: String(formData.get("title") ?? ""),
      property_type: String(formData.get("property_type") ?? ""),
      listing_type: listingType,
      price_aed: Number(formData.get("price_aed")) || 0,
      community_id: String(formData.get("community_id") ?? "") || null,
      location_text: String(formData.get("location_text") ?? "").trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
      bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null,
      size_sqft: formData.get("size_sqft") ? Number(formData.get("size_sqft")) : null,
      description: String(formData.get("description") ?? ""),
      amenities,
      availability_status: String(formData.get("availability_status") ?? "available"),
      visibility: String(formData.get("visibility") ?? "private"),
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || brokerWhatsapp,
    };

    let listingId = listing?.id;

    if (listing) {
      // Editing resets moderation back to pending -- admins review the
      // updated content before it's shown publicly again, same principle
      // as any other moderated listing edit.
      const { error } = await supabase
        .from("broker_listings")
        .update({ ...payload, moderation_status: "pending", rejection_reason: null })
        .eq("id", listing.id);
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }
    } else {
      const title = String(formData.get("title") ?? "");
      const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
      const { data, error } = await supabase
        .from("broker_listings")
        .insert({ ...payload, slug })
        .select("id")
        .single();
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }
      listingId = data.id;
    }

    if (listingId && (galleryFiles.length > 0 || floorPlanFiles.length > 0)) {
      const allFiles = [
        ...galleryFiles.map((f) => ({ file: f, folder: "gallery" })),
        ...floorPlanFiles.map((f) => ({ file: f, folder: "floor-plans" })),
      ];
      for (let i = 0; i < allFiles.length; i++) {
        const { file, folder } = allFiles[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${listingId}/${folder}/${Date.now()}-${safeName}`;
        const { promise } = uploadFileWithProgress("broker-listing-media", path, file, (p) =>
          setUploadPercent(Math.round(((i + p / 100) / allFiles.length) * 100))
        );
        await promise;
      }
    }

    setStatus("idle");
    router.push("/broker/listings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-100">Property Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Property Title" name="title" defaultValue={listing?.title} required className="sm:col-span-2" />
          <SelectField
            label="Property Type"
            name="property_type"
            defaultValue={listing?.property_type}
            options={fallbackPropertyTypes.map((v) => ({ label: v, value: v }))}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Sale / Rent / Lease</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value as "sale" | "rent" | "lease")}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
              <option value="lease">Lease</option>
            </select>
          </div>
          <Field label="Price (AED)" name="price_aed" type="number" defaultValue={listing?.price_aed?.toString()} required />
          <SelectField
            label="Property Status"
            name="availability_status"
            defaultValue={listing?.availability_status ?? "available"}
            options={[
              { label: "Available", value: "available" },
              { label: "Under Offer", value: "under_offer" },
              { label: "Sold", value: "sold" },
              { label: "Rented", value: "rented" },
            ]}
          />
          <SelectField
            label="Community"
            name="community_id"
            defaultValue={listing?.community_id ?? ""}
            options={[{ label: "Select a community", value: "" }, ...communities.map((c) => ({ label: c.name, value: c.id }))]}
          />
          <Field label="Location (optional)" name="location_text" defaultValue={listing?.location_text ?? ""} placeholder="e.g. Marina Promenade, Tower 3" />
          <SelectField
            label="Who Can See This"
            name="visibility"
            // A brand-new listing defaults to "private" (nudges the
            // broker to explicitly promote it once ready). Editing an
            // existing row falls back to "public" if visibility is
            // somehow missing -- matching the column's own DB default,
            // not silently showing "Private" for a listing that's
            // actually public.
            defaultValue={listing ? listing.visibility ?? "public" : "private"}
            options={[
              { label: "Private — only visible to you", value: "private" },
              { label: "Team — visible to brokers in your agency", value: "team" },
              { label: "Presentation — shareable via a direct link, not listed publicly", value: "presentation" },
              { label: "Public — listed publicly once approved", value: "public" },
            ]}
          />
          <Field label="Bedrooms" name="bedrooms" type="number" defaultValue={listing?.bedrooms?.toString() ?? ""} />
          <Field label="Bathrooms" name="bathrooms" type="number" defaultValue={listing?.bathrooms?.toString() ?? ""} />
          <Field label="Size (Sq Ft)" name="size_sqft" type="number" defaultValue={listing?.size_sqft?.toString() ?? ""} />
          <Field label="WhatsApp Contact" name="whatsapp" defaultValue={listing?.whatsapp ?? brokerWhatsapp} placeholder={brokerWhatsapp} />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-ink-400">Description</label>
          <textarea
            name="description"
            defaultValue={listing?.description ?? ""}
            rows={4}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        <h2 className="mb-1 text-sm font-semibold text-ink-100">Map Location (optional)</h2>
        <p className="mb-3 text-xs text-ink-500">
          Pin this listing&apos;s exact spot -- lets it show on the interactive map and enables real location
          intelligence on shared presentations. Leave as-is to skip.
        </p>
        <CoordinatesPicker
          lat={coords.lat}
          lng={coords.lng}
          onChange={(lat, lng) => setCoords({ lat, lng })}
          communities={coordCommunities}
        />
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Latitude</label>
            <input
              type="number"
              step="any"
              value={coords.lat}
              onChange={(e) => setCoords((prev) => ({ ...prev, lat: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Longitude</label>
            <input
              type="number"
              step="any"
              value={coords.lng}
              onChange={(e) => setCoords((prev) => ({ ...prev, lng: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">Amenities</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fallbackAmenities.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} className="accent-gold-500" />
              {a}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        <h2 className="mb-1 text-sm font-semibold text-ink-100">Gallery Images</h2>
        <p className="mb-3 text-xs text-ink-500">Uploaded when you save. {listing ? "Existing photos stay unless you remove them separately." : ""}</p>
        <FilePicker files={galleryFiles} setFiles={setGalleryFiles} accept="image/*" label="Add Photos" />
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-6">
        <h2 className="mb-1 text-sm font-semibold text-ink-100">Floor Plans (Optional)</h2>
        <FilePicker files={floorPlanFiles} setFiles={setFloorPlanFiles} accept="image/*,.pdf" label="Add Floor Plans" />
      </div>

      {status === "loading" && uploadPercent > 0 && (
        <UploadProgressItem fileName="Uploading media…" fileSize={0} state="uploading" percent={uploadPercent} />
      )}
      {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {status === "loading" ? "Saving…" : listing ? "Save Changes" : "Submit Listing for Review"}
      </button>
      {!listing && (
        <p className="text-xs text-ink-500">New listings are reviewed by our team before going live on the public site.</p>
      )}
    </form>
  );
}

function FilePicker({
  files,
  setFiles,
  accept,
  label,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
  accept: string;
  label: string;
}) {
  return (
    <div>
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-2.5 text-sm text-ink-300 hover:border-gold-500/40 hover:text-ink-100">
        <Upload className="h-4 w-4" />
        {label}
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs text-ink-300">
              <span className="truncate">{f.name}</span>
              <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="shrink-0 text-ink-500 hover:text-rose-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
