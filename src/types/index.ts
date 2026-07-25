export type ListingType = "buy" | "rent" | "off-plan" | "ready";

export type ProjectStatus =
  | "draft"
  | "published"
  | "expired"
  | "featured"
  | "rejected"
  | "archived";

export type ApprovalStatus = "pending" | "review" | "approved" | "rejected";

export type ProjectTag =
  | "new-launch"
  | "luxury"
  | "waterfront"
  | "villas"
  | "under-1m"
  | "high-roi";

export interface Developer {
  id: string;
  slug: string;
  name: string;
  initial: string;
  color: string;
  verified: boolean;
  founded: number;
  projectsCount: number;
  completedCount: number;
  underConstructionCount: number;
  rating: number;
  reviews: number;
  description: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  projectsCount: number;
  avgPriceAed: number;
  priceTrendPct: number;
  xPct: number;
  yPct: number;
  lng: number;
  lat: number;
  pinColor: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  developerId: string;
  communityId: string;
  propertyType: string;
  listingType: ListingType;
  status: ProjectStatus;
  approvalStatus: ApprovalStatus;
  featured: boolean;
  priceFromAed: number;
  paymentPlan: string;
  bedroomsFrom: number;
  bedroomsTo: number;
  unitTypes: string[];
  handoverQuarter: string;
  handoverYear: number;
  rating: number;
  reviews: number;
  gradient: string;
  coverImageUrl?: string | null;
  tags: ProjectTag[];
  description: string;
  amenities: string[];
  views: number;
  leads: number;
  bookings: number;
  lat?: number | null;
  lng?: number | null;
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  launchDate?: string | null;
  unitTypePrices?: Record<string, number>;
  paymentPlanDetails?: { label: string; percent: number }[];
  constructionProgressPercent?: number;
  // Optional denormalized fields populated when sourced from a Supabase
  // join (real data). Falls back to the mock `getDeveloper`/`getCommunity`
  // lookups when absent, so existing mock-backed pages keep working.
  developerName?: string;
  developerColor?: string;
  developerSlug?: string;
  developerPhone?: string | null;
  communityName?: string;
  communitySlug?: string;
  createdAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  budgetAed: number;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  projectName: string;
  source: string;
  date: string;
  assignedAgent: string;
  notes: string;
}

export interface Booking {
  id: string;
  projectName: string;
  clientName: string;
  date: string;
  time: string;
  agent: string;
  status: "confirmed" | "cancelled" | "completed";
}

export interface AnalyticsPoint {
  date: string;
  views: number;
  leads: number;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
}
