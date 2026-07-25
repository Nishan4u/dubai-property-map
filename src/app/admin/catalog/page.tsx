import { CatalogManager } from "@/components/admin/CatalogManager";
import { getAmenitiesList, getPropertyTypes } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const [propertyTypes, amenities] = await Promise.all([
    getPropertyTypes(),
    getAmenitiesList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Catalog</h1>
        <p className="text-sm text-ink-400">
          Manage the Property Types and Amenities lists developers choose
          from when listing a project. Dubai Property Map covers Dubai only,
          so Cities/Areas are managed via the Communities page.
        </p>
      </div>
      <CatalogManager propertyTypes={propertyTypes} amenities={amenities} />
    </div>
  );
}
