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
  featured: boolean;
  // Organization-level RERA registration -- distinct from a broker's own
  // brn/orn. Manual-entry only.
  reraRegistrationNumber?: string | null;
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
  featured: boolean;
  /** Real named sub-region grouping (e.g. "Marina & New Dubai", "Deira") —
   * only present for communities imported with a source region label;
   * optional so the ~15 hardcoded mock.ts communities keep working. */
  region?: string | null;
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
  featuredUntil?: string | null;
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
  logoUrl?: string | null;
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
  escrowStatus?: "available" | "not_available" | null;
  furnishing?: "furnished" | "unfurnished" | "semi_furnished" | null;
  /** Only meaningful when listingType === "ready" -- how many years old the
   * building is. Null/undefined for off-plan projects or when not set. */
  buildingAgeYears?: number | null;
  updatedAt?: string;
  // UAE regulatory/permit fields (patch_139) -- manual-entry only, never
  // auto-populated/validated against a real DLD/RERA/Madmoun API.
  dldPermitNumber?: string | null;
  trakheesiNumber?: string | null;
  madmounQrUrl?: string | null;
  // patch_149 -- 'manual' (every existing/normal-flow project) or
  // 'ai_extracted' (created via Upload Brochure -> AI Draft Project).
  dataSource?: "manual" | "ai_extracted";
  // patch_150 -- which AI path an ai_extracted project came from.
  // Gates the public AiDiscoveryDisclosure badge (web_discovery only --
  // a brochure upload was submitted by the real developer and always
  // goes through human review before publishing, unlike discovery).
  aiSourceType?: "brochure_upload" | "web_discovery" | null;
  // patch_151 -- when this web_discovery project was last re-checked
  // for changes by the AI Discovery refresh cycle. Null until its
  // first check-in, and always null for manual/brochure projects.
  aiLastCheckedAt?: string | null;
  // Derived from the project_unit_types child table when the list query
  // joins it (spec section 12: Unit Type / Size sqft search filters).
  // Absent (not empty-array) when the query didn't join it.
  structuredUnitTypes?: string[];
  unitSizeSqftMin?: number | null;
  unitSizeSqftMax?: number | null;
  // Optional denormalized fields populated when sourced from a Supabase
  // join (real data). Falls back to the mock `getDeveloper`/`getCommunity`
  // lookups when absent, so existing mock-backed pages keep working.
  developerName?: string;
  developerColor?: string;
  developerSlug?: string;
  developerPhone?: string | null;
  developerLogoUrl?: string | null;
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
