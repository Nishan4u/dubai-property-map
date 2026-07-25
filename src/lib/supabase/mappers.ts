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
    featured: row.featured,
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
    createdAt: row.created_at,
    developerName: row.developers?.name,
    developerColor: row.developers?.color,
    developerSlug: row.developers?.slug,
    developerPhone: row.developers?.phone ?? null,
    communityName: row.communities?.name,
    communitySlug: row.communities?.slug,
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
