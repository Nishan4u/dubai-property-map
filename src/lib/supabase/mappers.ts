import type {
  CommunityRow,
  DeveloperRow,
  ProjectWithRelations,
} from "@/types/database";
import type { Community, Developer, Project, ProjectTag } from "@/types";

export function mapProject(row: ProjectWithRelations): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developerId: row.developer_id,
    communityId: row.community_id,
    propertyType: row.property_type,
    listingType: row.listing_type,
    status: row.status,
    approvalStatus: row.approval_status,
    // featured_until is optional -- null means no expiry (every existing
    // admin-set featured project keeps working exactly as before); a real
    // timestamp is a paid boost (see patch_99) that lapses once it's past,
    // without needing a background job to flip the boolean back.
    featured: row.featured && (!row.featured_until || new Date(row.featured_until) > new Date()),
    priceFromAed: row.price_from_aed,
    paymentPlan: row.payment_plan ?? "",
    bedroomsFrom: row.bedrooms_from,
    bedroomsTo: row.bedrooms_to,
    unitTypes: row.unit_types,
    handoverQuarter: row.handover_quarter ?? "",
    handoverYear: row.handover_year ?? 0,
    rating: Number(row.rating),
    reviews: row.reviews,
    gradient: row.gradient,
    coverImageUrl: row.cover_image_url ?? null,
    logoUrl: row.logo_url ?? null,
    tags: row.tags as ProjectTag[],
    description: row.description ?? "",
    amenities: row.amenities,
    views: row.views,
    leads: 0,
    bookings: 0,
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : null,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : null,
    videoUrl: row.video_url ?? null,
    virtualTourUrl: row.virtual_tour_url ?? null,
    launchDate: row.launch_date ?? null,
    unitTypePrices: row.unit_type_prices ?? {},
    paymentPlanDetails: row.payment_plan_details ?? [],
    constructionProgressPercent: row.construction_progress_percent ?? 0,
    escrowStatus: row.escrow_status ?? null,
    furnishing: row.furnishing ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    developerName: row.developers?.name,
    developerColor: row.developers?.color,
    developerSlug: row.developers?.slug,
    developerPhone: row.developers?.phone ?? null,
    developerLogoUrl: row.developers?.logo_url ?? null,
    communityName: row.communities?.name,
    communitySlug: row.communities?.slug,
    structuredUnitTypes: row.project_unit_types
      ? Array.from(new Set(row.project_unit_types.map((u) => u.unit_type)))
      : undefined,
    unitSizeSqftMin: row.project_unit_types
      ? row.project_unit_types.reduce<number | null>((min, u) => {
          if (u.size_sqft == null) return min;
          return min == null ? u.size_sqft : Math.min(min, u.size_sqft);
        }, null)
      : undefined,
    unitSizeSqftMax: row.project_unit_types
      ? row.project_unit_types.reduce<number | null>((max, u) => {
          if (u.size_sqft == null) return max;
          return max == null ? u.size_sqft : Math.max(max, u.size_sqft);
        }, null)
      : undefined,
  };
}

export function mapDeveloper(
  row: DeveloperRow,
  stats?: { projectsCount?: number; completedCount?: number; underConstructionCount?: number }
): Developer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    initial: row.initial,
    color: row.color,
    verified: row.verified,
    founded: row.founded ?? 0,
    projectsCount: stats?.projectsCount ?? 0,
    completedCount: stats?.completedCount ?? 0,
    underConstructionCount: stats?.underConstructionCount ?? 0,
    rating: 0,
    reviews: 0,
    description: row.description ?? "",
    email: row.email ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    logoUrl: row.logo_url ?? null,
  };
}

export function mapCommunity(
  row: CommunityRow,
  stats?: { projectsCount?: number; avgPriceAed?: number }
): Community {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    projectsCount: stats?.projectsCount ?? 0,
    avgPriceAed: stats?.avgPriceAed ?? 0,
    priceTrendPct: 0,
    xPct: Number(row.x_pct ?? 0),
    yPct: Number(row.y_pct ?? 0),
    lng: Number(row.lng ?? 0),
    lat: Number(row.lat ?? 0),
    pinColor: row.pin_color,
  };
}

export function currentYear() {
  return new Date().getFullYear();
}
