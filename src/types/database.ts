export type UserRole = "buyer" | "developer" | "admin" | "broker" | "broker_agency" | "salesperson";
export type DbBrokerAccountStatus =
  | "pending_verification"
  | "approved"
  | "rejected"
  | "suspended"
  | "blocked";
export type DbBrokerSubscriptionStatus =
  | "no_subscription"
  | "payment_pending"
  | "active"
  | "expired"
  | "cancelled"
  | "payment_failed"
  | "suspended";
export type DbDeveloperSubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "suspended";
export type DbSalespersonStatus = "active" | "inactive" | "pending_invitation";
export type DbBankTransferAccountType = "developer" | "broker" | "salesperson" | "broker_agency";
export type DbBankTransferStatus = "verification_pending" | "paid" | "rejected";
export type DbPaymentType = "stripe" | "bank_transfer" | "admin_free";
export type DbSubscriptionPlanStatus = "active" | "inactive";
export type DbSubscriptionPlanType = "developer" | "broker" | "salesperson";

export interface SubscriptionPlanFeatureLimits {
  max_active_listings?: number | null;
  max_featured_pins?: number | null;
  homepage_banner_allowed?: boolean;
}

export interface SubscriptionPlanRow {
  id: string;
  key: string;
  name: string;
  price_label: string;
  features: string[];
  stripe_price_id: string | null;
  sort_order: number;
  plan_type: DbSubscriptionPlanType;
  description: string | null;
  duration_days: number | null;
  status: DbSubscriptionPlanStatus;
  is_popular: boolean;
  is_recommended: boolean;
  online_payment_enabled: boolean;
  bank_transfer_enabled: boolean;
  renewal_allowed_when_inactive: boolean;
  feature_limits: SubscriptionPlanFeatureLimits;
  created_at: string;
}

export interface SubscriptionGrantRow {
  id: string;
  account_type: DbBankTransferAccountType;
  developer_id: string | null;
  broker_id: string | null;
  salesperson_id: string | null;
  brokerage_id: string | null;
  plan_key: string;
  granted_by: string;
  start_date: string;
  expiry_date: string | null;
  reason: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
}

export interface SubscriptionBankTransferRow {
  id: string;
  account_type: DbBankTransferAccountType;
  developer_id: string | null;
  broker_id: string | null;
  salesperson_id: string | null;
  brokerage_id: string | null;
  plan_key: string;
  amount_aed: number;
  receipt_url: string;
  transaction_reference: string | null;
  transfer_date: string | null;
  note: string | null;
  status: DbBankTransferStatus;
  rejection_reason: string | null;
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
export type DbEmailLogStatus = "pending" | "sent" | "failed";
export type DeveloperStatus = "pending" | "active" | "suspended";
export type DbProjectStatus =
  | "draft"
  | "published"
  | "expired"
  | "featured"
  | "rejected"
  | "archived";
export type DbApprovalStatus = "pending" | "review" | "approved" | "rejected";
export type DbListingType = "buy" | "rent" | "off-plan" | "ready";
export type DbLeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";
export type DbBookingStatus = "confirmed" | "cancelled" | "completed";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  developer_id: string | null;
  broker_id: string | null;
  salesperson_id: string | null;
  created_at: string;
}

export interface DeveloperRow {
  id: string;
  slug: string;
  name: string;
  initial: string;
  color: string;
  verified: boolean;
  founded: number | null;
  description: string | null;
  name_ar: string | null;
  description_ar: string | null;
  status: DeveloperStatus;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  approved_email_domain: string | null;
  plan_tier: string;
  subscription_status: DbDeveloperSubscriptionStatus;
  is_complimentary: boolean;
  subscription_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_type: DbPaymentType | null;
  last_reminder_sent_days: number | null;
  featured: boolean;
  created_at: string;
}

export interface DeveloperAwardRow {
  id: string;
  developer_id: string;
  title: string;
  year: number | null;
  issuer: string | null;
  created_at: string;
}

export interface DeveloperReviewRow {
  id: string;
  developer_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DeveloperMessageRow {
  id: string;
  developer_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export interface FavoriteCommunityRow {
  id: string;
  user_id: string;
  community_id: string;
  created_at: string;
}

export interface NavLinkRow {
  id: string;
  label: string;
  url: string;
  location: "header" | "footer";
  sort_order: number;
  created_at: string;
}

export interface RedirectRow {
  id: string;
  from_path: string;
  to_path: string;
  permanent: boolean;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  name_ar: string | null;
  description_ar: string | null;
  lng: number | null;
  lat: number | null;
  x_pct: number | null;
  y_pct: number | null;
  pin_color: string;
  meta_title: string | null;
  meta_description: string | null;
  boundary_radius_km: number | null;
  featured: boolean;
  region: string | null;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  developer_id: string;
  community_id: string;
  property_type: string;
  listing_type: DbListingType;
  status: DbProjectStatus;
  approval_status: DbApprovalStatus;
  featured: boolean;
  featured_until: string | null;
  price_from_aed: number;
  payment_plan: string | null;
  bedrooms_from: number;
  bedrooms_to: number;
  unit_types: string[];
  handover_quarter: string | null;
  handover_year: number | null;
  rating: number;
  reviews: number;
  gradient: string;
  cover_image_url: string | null;
  logo_url: string | null;
  tags: string[];
  description: string | null;
  amenities: string[];
  views: number;
  lat: number | null;
  lng: number | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  launch_date: string | null;
  unit_type_prices: Record<string, number>;
  payment_plan_details: { label: string; percent: number }[];
  construction_progress_percent: number;
  escrow_status: "available" | "not_available" | null;
  furnishing: "furnished" | "unfurnished" | "semi_furnished" | null;
  // Only meaningful for listing_type = "ready" -- an off-plan project has
  // no age yet. Nullable, no default (see patch_126_building_age.sql).
  building_age_years: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConstructionMilestoneRow {
  id: string;
  project_id: string;
  title: string;
  milestone_date: string | null;
  completed: boolean;
  created_at: string;
}

export interface ProjectUnitTypeRow {
  id: string;
  project_id: string;
  unit_name: string;
  unit_type: string;
  starting_price_aed: number | null;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  has_balcony: boolean;
  has_parking: boolean;
  availability: "available" | "limited" | "sold_out";
  sort_order: number;
  image_url: string | null;
  created_at: string;
}

export interface ProjectUnitRow {
  id: string;
  project_id: string;
  unit_type_id: string;
  unit_number: string;
  floor: string | null;
  price_aed: number | null;
  status: "available" | "reserved" | "sold";
  created_at: string;
  updated_at: string;
}

export interface UpcomingProjectRow {
  id: string;
  developer_id: string;
  internal_name: string;
  lat: number;
  lng: number;
  logo_url: string | null;
  status: "active" | "launched";
  launched_project_id: string | null;
  created_at: string;
}

export interface UpcomingProjectPublicRow {
  id: string;
  lat: number;
  lng: number;
  logo_url: string | null;
  developer_name: string;
  developer_slug: string;
  developer_id: string;
}

// A broker's interest enquiry against a developer's "Coming Soon" pin
// (patch_131) -- broker -> developer, the opposite direction from
// broker_project_enquiries (buyer -> broker).
export interface UpcomingProjectInterestRow {
  id: string;
  upcoming_project_id: string;
  broker_id: string;
  created_by: string | null;
  name: string;
  email: string | null;
  whatsapp: string | null;
  message: string | null;
  created_at: string;
}

export interface ProjectEventRow {
  id: string;
  project_id: string;
  event_type: "click" | "whatsapp" | "phone" | "map_click";
  created_at: string;
}

export interface ProjectWithRelations extends ProjectRow {
  developers: DeveloperRow;
  communities: CommunityRow;
  project_unit_types?: { unit_type: string; size_sqft: number | null }[];
}

export interface LeadRow {
  id: string;
  project_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  country: string | null;
  budget_aed: number | null;
  status: DbLeadStatus;
  source: string;
  assigned_agent: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  project_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  agent: string | null;
  status: DbBookingStatus;
  created_by: string | null;
  created_at: string;
}

export interface SavedSearchRow {
  id: string;
  user_id: string;
  label: string;
  filters: Record<string, unknown>;
  created_at: string;
}

export interface BrochureDownloadRow {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  message: string;
  project_id: string | null;
  read: boolean;
  created_at: string;
}

export interface BrokerageRow {
  id: string;
  name: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export type DbBrokerVerificationStatus = "none" | "pending_payment" | "active" | "rejected" | "revoked" | "expired";

export interface BrokerRow {
  id: string;
  brokerage_id: string;
  full_name: string;
  brn: string;
  orn: string;
  email: string;
  mobile: string;
  whatsapp: string;
  photo_url: string | null;
  rera_card_path: string | null;
  account_status: DbBrokerAccountStatus;
  rejection_reason: string | null;
  suspension_reason: string | null;
  plan_key: string | null;
  subscription_status: DbBrokerSubscriptionStatus;
  is_complimentary: boolean;
  subscription_expires_at: string | null;
  last_reminder_sent_days: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_type: DbPaymentType | null;
  approved_at: string | null;
  approved_by: string | null;
  // Broker Directory & Property Listing Module (patch_127)
  slug: string;
  bio: string | null;
  experience_years: number | null;
  languages: string[];
  verification_status: DbBrokerVerificationStatus;
  verification_expires_at: string | null;
  featured: boolean;
  profile_views: number;
  created_at: string;
  updated_at: string;
}

export interface BrokerWithRelations extends BrokerRow {
  brokerages: BrokerageRow;
}

// ============ Broker Directory & Property Listing Module (patch_127) ============

export type DbBrokerListingType = "sale" | "rent" | "lease";
export type DbBrokerListingAvailability = "available" | "under_offer" | "sold" | "rented";
export type DbBrokerListingModeration = "pending" | "approved" | "rejected" | "archived";

export interface BrokerListingRow {
  id: string;
  broker_id: string;
  slug: string;
  title: string;
  property_type: string;
  listing_type: DbBrokerListingType;
  price_aed: number;
  community_id: string | null;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  description: string | null;
  amenities: string[];
  availability_status: DbBrokerListingAvailability;
  moderation_status: DbBrokerListingModeration;
  rejection_reason: string | null;
  whatsapp: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface BrokerProjectLinkRow {
  id: string;
  broker_id: string;
  project_id: string;
  created_at: string;
}

export interface BrokerProjectEnquiryRow {
  id: string;
  broker_id: string;
  project_id: string;
  created_by: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
}

// brokers_public_profile view -- deliberately excludes email/mobile/
// whatsapp/orn/rera_card_path/stripe fields, see patch_127.
export interface BrokerPublicProfileRow {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  experience_years: number | null;
  languages: string[];
  brn: string;
  verification_status: DbBrokerVerificationStatus;
  verification_expires_at: string | null;
  featured: boolean;
  profile_views: number;
  created_at: string;
  brokerage_id: string | null;
  brokerage_name: string | null;
  brokerage_verified: boolean | null;
}

export interface SalespersonRow {
  id: string;
  developer_id: string;
  full_name: string;
  job_title: string | null;
  employee_id: string | null;
  email: string;
  mobile: string | null;
  whatsapp: string | null;
  photo_url: string | null;
  status: DbSalespersonStatus;
  plan_key: string | null;
  subscription_status: DbBrokerSubscriptionStatus;
  is_complimentary: boolean;
  subscription_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_type: DbPaymentType | null;
  last_reminder_sent_days: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrokerSalespersonRelationshipRow {
  id: string;
  broker_id: string;
  developer_id: string;
  salesperson_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLogRow {
  id: string;
  category: string;
  to_email: string;
  subject: string;
  body_html: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: DbEmailLogStatus;
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}
