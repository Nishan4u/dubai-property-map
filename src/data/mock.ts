import type {
  Activity,
  AnalyticsPoint,
  Booking,
  Community,
  Developer,
  Lead,
  Project,
} from "@/types";

export const developers: Developer[] = [
  {
    id: "dev-emaar",
    slug: "emaar-properties",
    name: "Emaar Properties",
    initial: "E",
    color: "#22c55e",
    verified: true,
    featured: false,
    founded: 1997,
    projectsCount: 120,
    completedCount: 88,
    underConstructionCount: 32,
    rating: 4.8,
    reviews: 3120,
    description:
      "Master developer behind Downtown Dubai, Dubai Marina and Dubai Hills Estate — one of the region's largest listed real estate companies.",
  },
  {
    id: "dev-damac",
    slug: "damac-properties",
    name: "DAMAC Properties",
    initial: "D",
    color: "#eab308",
    verified: true,
    featured: false,
    founded: 2002,
    projectsCount: 98,
    completedCount: 61,
    underConstructionCount: 37,
    rating: 4.7,
    reviews: 2210,
    description:
      "Luxury developer known for branded residences and golf-front communities across Dubai.",
  },
  {
    id: "dev-sobha",
    slug: "sobha-realty",
    name: "Sobha Realty",
    initial: "S",
    color: "#3b82f6",
    verified: true,
    featured: false,
    founded: 1976,
    projectsCount: 76,
    completedCount: 54,
    underConstructionCount: 22,
    rating: 4.7,
    reviews: 1870,
    description:
      "Premium developer focused on craftsmanship, best known for Sobha Hartland along the Dubai Water Canal.",
  },
  {
    id: "dev-nakheel",
    slug: "nakheel",
    name: "Nakheel",
    initial: "N",
    color: "#a855f7",
    verified: true,
    featured: false,
    founded: 2000,
    projectsCount: 65,
    completedCount: 48,
    underConstructionCount: 17,
    rating: 4.6,
    reviews: 1540,
    description:
      "Creator of Palm Jumeirah and other landmark waterfront master communities.",
  },
  {
    id: "dev-binghatti",
    slug: "binghatti",
    name: "Binghatti",
    initial: "B",
    color: "#f97316",
    verified: true,
    featured: false,
    founded: 2008,
    projectsCount: 54,
    completedCount: 33,
    underConstructionCount: 21,
    rating: 4.5,
    reviews: 980,
    description:
      "Fast-growing Dubai developer known for distinctive architecture and rapid off-plan delivery in Business Bay and JVC.",
  },
  {
    id: "dev-ellington",
    slug: "ellington-properties",
    name: "Ellington Properties",
    initial: "EL",
    color: "#14b8a6",
    verified: true,
    featured: false,
    founded: 2014,
    projectsCount: 31,
    completedCount: 19,
    underConstructionCount: 12,
    rating: 4.6,
    reviews: 640,
    description:
      "Design-led boutique developer with a focus on art-inspired residential communities.",
  },
];

export const communities: Community[] = [
  { id: "com-palm", slug: "palm-jumeirah", name: "Palm Jumeirah", description: "Iconic man-made island with beachfront villas and branded residences.", projectsCount: 12, avgPriceAed: 4200000, priceTrendPct: 8.2, xPct: 9, yPct: 30, lng: 55.1385, lat: 25.1124, pinColor: "#3b82f6", featured: false },
  { id: "com-marina", slug: "dubai-marina", name: "Dubai Marina", description: "High-rise waterfront living with a bustling promenade and marina walk.", projectsCount: 18, avgPriceAed: 1900000, priceTrendPct: 5.4, xPct: 21, yPct: 36, lng: 55.1400, lat: 25.0805, pinColor: "#eab308", featured: false },
  { id: "com-jlt", slug: "jumeirah-lakes-towers", name: "Jumeirah Lakes Towers", description: "Mixed-use lake-front towers close to Dubai Marina and JBR.", projectsCount: 18, avgPriceAed: 1200000, priceTrendPct: 4.1, xPct: 25, yPct: 46, lng: 55.1420, lat: 25.0693, pinColor: "#22c55e", featured: false },
  { id: "com-jvc", slug: "jumeirah-village-circle", name: "Jumeirah Village Circle", description: "Family-friendly circular community with parks and affordable apartments.", projectsCount: 11, avgPriceAed: 850000, priceTrendPct: 6.7, xPct: 17, yPct: 58, lng: 55.2080, lat: 25.0596, pinColor: "#f97316", featured: false },
  { id: "com-motorcity", slug: "motor-city", name: "Motor City", description: "Motorsport-themed community with low-rise apartments and townhouses.", projectsCount: 8, avgPriceAed: 780000, priceTrendPct: 3.2, xPct: 23, yPct: 68, lng: 55.2400, lat: 25.0470, pinColor: "#3b82f6", featured: false },
  { id: "com-dubai-south", slug: "dubai-south", name: "Dubai South", description: "Airport-district master plan anchored by Al Maktoum International and Expo City.", projectsCount: 14, avgPriceAed: 690000, priceTrendPct: 9.8, xPct: 13, yPct: 82, lng: 55.1700, lat: 24.8970, pinColor: "#a855f7", featured: false },
  { id: "com-bay", slug: "business-bay", name: "Business Bay", description: "Dubai's business and lifestyle hub along the Dubai Water Canal.", projectsCount: 34, avgPriceAed: 1650000, priceTrendPct: 7.1, xPct: 45, yPct: 37, lng: 55.2708, lat: 25.1857, pinColor: "#22c55e", featured: false },
  { id: "com-downtown", slug: "downtown-dubai", name: "Downtown Dubai", description: "Home to Burj Khalifa, Dubai Mall and Dubai Fountain — the city's premium core.", projectsCount: 25, avgPriceAed: 2800000, priceTrendPct: 6.3, xPct: 53, yPct: 27, lng: 55.2744, lat: 25.1972, pinColor: "#ef4444", featured: false },
  { id: "com-creek", slug: "dubai-creek-harbour", name: "Dubai Creek Harbour", description: "Waterfront master plan facing Ras Al Khor, future home of Dubai Creek Tower.", projectsCount: 11, avgPriceAed: 1750000, priceTrendPct: 10.4, xPct: 69, yPct: 13, lng: 55.3467, lat: 25.1950, pinColor: "#3b82f6", featured: false },
  { id: "com-arjan", slug: "arjan", name: "Arjan", description: "Emerging affordable community near Dubai Miracle Garden.", projectsCount: 8, avgPriceAed: 720000, priceTrendPct: 5.9, xPct: 47, yPct: 58, lng: 55.2460, lat: 25.0630, pinColor: "#eab308", featured: false },
  { id: "com-damac-hills", slug: "damac-hills", name: "DAMAC Hills", description: "Golf-course community with villas, townhouses and Trump International Golf Club.", projectsCount: 13, avgPriceAed: 2100000, priceTrendPct: 4.8, xPct: 60, yPct: 58, lng: 55.2530, lat: 25.0290, pinColor: "#22c55e", featured: false },
  { id: "com-damac-hills-2", slug: "damac-hills-2", name: "DAMAC Hills 2", description: "Affordable family villas and townhouses further along Al Qudra Road.", projectsCount: 10, avgPriceAed: 1100000, priceTrendPct: 6.1, xPct: 67, yPct: 67, lng: 55.2200, lat: 24.9950, pinColor: "#a855f7", featured: false },
  { id: "com-hills", slug: "dubai-hills-estate", name: "Dubai Hills Estate", description: "Green master community with Dubai Hills Mall and championship golf course.", projectsCount: 15, avgPriceAed: 2400000, priceTrendPct: 7.8, xPct: 74, yPct: 37, lng: 55.2470, lat: 25.1050, pinColor: "#f97316", featured: false },
  { id: "com-meydan", slug: "meydan", name: "Meydan", description: "Home to Meydan Racecourse, canal-front villas and new golf residences.", projectsCount: 17, avgPriceAed: 3100000, priceTrendPct: 9.1, xPct: 79, yPct: 52, lng: 55.3050, lat: 25.1560, pinColor: "#3b82f6", featured: false },
];

const gradients = [
  "from-amber-500/40 via-slate-800 to-slate-950",
  "from-sky-500/40 via-slate-800 to-slate-950",
  "from-emerald-500/40 via-slate-800 to-slate-950",
  "from-fuchsia-500/40 via-slate-800 to-slate-950",
  "from-rose-500/40 via-slate-800 to-slate-950",
  "from-indigo-500/40 via-slate-800 to-slate-950",
];

function grad(i: number) {
  return gradients[i % gradients.length];
}

export const projects: Project[] = [
  { id: "p1", slug: "chelsea-residences", name: "Chelsea Residences", developerId: "dev-damac", communityId: "com-downtown", propertyType: "Apartments", listingType: "off-plan", status: "featured", approvalStatus: "approved", featured: true, priceFromAed: 1200000, paymentPlan: "70/30", bedroomsFrom: 1, bedroomsTo: 4, unitTypes: ["1BR", "2BR", "3BR", "4BR"], handoverQuarter: "Q2", handoverYear: 2028, rating: 4.8, reviews: 128, gradient: grad(0), tags: ["new-launch", "waterfront"], description: "Waterfront residences in the heart of Downtown Dubai with resort-style amenities and skyline views.", amenities: ["Pool", "Gym", "Kids Area", "Cinema", "Sky Lounge", "Smart Home"], views: 2842, leads: 214, bookings: 46 },
  { id: "p2", slug: "sobha-hartland-ii", name: "Sobha Hartland II", developerId: "dev-sobha", communityId: "com-bay", propertyType: "Apartments", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 1600000, paymentPlan: "60/40", bedroomsFrom: 1, bedroomsTo: 4, unitTypes: ["1BR", "2BR", "3BR", "4BR"], handoverQuarter: "Q4", handoverYear: 2027, rating: 4.7, reviews: 96, gradient: grad(1), tags: ["luxury", "waterfront"], description: "A lush waterfront extension of Sobha Hartland with lagoon views and premium finishes.", amenities: ["Pool", "Gym", "Beach", "Parking", "Pet Friendly"], views: 2317, leads: 187, bookings: 38 },
  { id: "p3", slug: "binghatti-skyrise", name: "Binghatti Skyrise", developerId: "dev-binghatti", communityId: "com-bay", propertyType: "Apartments", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 1100000, paymentPlan: "50/50", bedroomsFrom: 0, bedroomsTo: 3, unitTypes: ["Studio", "1BR", "2BR", "3BR"], handoverQuarter: "Q1", handoverYear: 2027, rating: 4.5, reviews: 74, gradient: grad(2), tags: ["new-launch", "high-roi"], description: "Bold architectural tower in Business Bay with striking facades and canal views.", amenities: ["Pool", "Gym", "Sky Lounge", "Parking"], views: 1942, leads: 151, bookings: 29 },
  { id: "p4", slug: "bay-by-cavalli", name: "Bay by Cavalli", developerId: "dev-damac", communityId: "com-creek", propertyType: "Apartments", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 2900000, paymentPlan: "70/30", bedroomsFrom: 2, bedroomsTo: 5, unitTypes: ["2BR", "3BR", "4BR", "5BR"], handoverQuarter: "Q4", handoverYear: 2028, rating: 4.8, reviews: 61, gradient: grad(3), tags: ["luxury", "waterfront", "high-roi"], description: "Roberto Cavalli-branded waterfront residences overlooking Dubai Creek Harbour.", amenities: ["Pool", "Gym", "Beach", "Cinema", "Smart Home"], views: 1781, leads: 136, bookings: 24 },
  { id: "p5", slug: "ellington-house-iv", name: "Ellington House IV", developerId: "dev-ellington", communityId: "com-hills", propertyType: "Apartments", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 1800000, paymentPlan: "60/40", bedroomsFrom: 1, bedroomsTo: 4, unitTypes: ["1BR", "2BR", "3BR", "4BR"], handoverQuarter: "Q2", handoverYear: 2027, rating: 4.6, reviews: 52, gradient: grad(4), tags: ["luxury"], description: "Art-inspired residences in Dubai Hills Estate with golf course views.", amenities: ["Pool", "Gym", "Kids Area", "Parking"], views: 1512, leads: 121, bookings: 19 },
  { id: "p6", slug: "palm-beach-towers", name: "Palm Beach Towers", developerId: "dev-nakheel", communityId: "com-palm", propertyType: "Apartments", listingType: "ready", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 3800000, paymentPlan: "100% on handover", bedroomsFrom: 1, bedroomsTo: 3, unitTypes: ["1BR", "2BR", "3BR"], handoverQuarter: "Q1", handoverYear: 2026, rating: 4.9, reviews: 210, gradient: grad(5), tags: ["luxury", "waterfront"], description: "Beachfront towers on Palm Jumeirah's crescent with private beach access.", amenities: ["Beach", "Pool", "Gym", "Smart Home", "Parking"], views: 3120, leads: 260, bookings: 58 },
  { id: "p7", slug: "marina-vista", name: "Marina Vista", developerId: "dev-emaar", communityId: "com-marina", propertyType: "Apartments", listingType: "ready", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 1450000, paymentPlan: "100% on handover", bedroomsFrom: 1, bedroomsTo: 3, unitTypes: ["1BR", "2BR", "3BR"], handoverQuarter: "Q3", handoverYear: 2025, rating: 4.6, reviews: 143, gradient: grad(0), tags: ["waterfront"], description: "Marina-facing apartments minutes from JBR Beach and the tram.", amenities: ["Pool", "Gym", "Parking", "Kids Area"], views: 1988, leads: 132, bookings: 21 },
  { id: "p8", slug: "jlt-city-towers", name: "JLT City Towers", developerId: "dev-binghatti", communityId: "com-jlt", propertyType: "Apartments", listingType: "rent", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 65000, paymentPlan: "1 cheque", bedroomsFrom: 0, bedroomsTo: 2, unitTypes: ["Studio", "1BR", "2BR"], handoverQuarter: "Ready", handoverYear: 2024, rating: 4.3, reviews: 88, gradient: grad(2), tags: ["under-1m"], description: "Well-connected lake-view towers with easy access to JBR and Marina.", amenities: ["Pool", "Gym", "Parking"], views: 1244, leads: 96, bookings: 14 },
  { id: "p9", slug: "circle-mansions", name: "Circle Mansions", developerId: "dev-ellington", communityId: "com-jvc", propertyType: "Villas", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 980000, paymentPlan: "80/20", bedroomsFrom: 1, bedroomsTo: 3, unitTypes: ["1BR", "2BR", "3BR"], handoverQuarter: "Q3", handoverYear: 2026, rating: 4.4, reviews: 41, gradient: grad(1), tags: ["under-1m", "high-roi"], description: "Contemporary low-rise residences around JVC's central park.", amenities: ["Pool", "Gym", "Kids Area"], views: 1032, leads: 74, bookings: 11 },
  { id: "p10", slug: "damac-lagoons-venice", name: "DAMAC Lagoons – Venice", developerId: "dev-damac", communityId: "com-damac-hills-2", propertyType: "Villas", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 1450000, paymentPlan: "70/30", bedroomsFrom: 3, bedroomsTo: 6, unitTypes: ["3BR", "4BR", "5BR", "6BR"], handoverQuarter: "Q2", handoverYear: 2027, rating: 4.5, reviews: 67, gradient: grad(3), tags: ["villas", "waterfront"], description: "Venice-themed lagoon villas with crystal lagoons and white-sand beaches.", amenities: ["Beach", "Pool", "Golf", "Parking", "Pet Friendly"], views: 1670, leads: 118, bookings: 22 },
  { id: "p11", slug: "trump-estates", name: "Trump Estates", developerId: "dev-damac", communityId: "com-damac-hills", propertyType: "Villas", listingType: "ready", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 4200000, paymentPlan: "100% on handover", bedroomsFrom: 4, bedroomsTo: 7, unitTypes: ["4BR", "5BR", "6BR", "7BR"], handoverQuarter: "Ready", handoverYear: 2024, rating: 4.7, reviews: 39, gradient: grad(4), tags: ["luxury", "villas"], description: "Golf-front luxury villas at DAMAC Hills bordering the Trump International Golf Club.", amenities: ["Golf", "Pool", "Smart Home", "Parking"], views: 1420, leads: 88, bookings: 16 },
  { id: "p12", slug: "creek-rise-towers", name: "Creek Rise Towers", developerId: "dev-emaar", communityId: "com-creek", propertyType: "Apartments", listingType: "off-plan", status: "published", approvalStatus: "pending", featured: false, priceFromAed: 1350000, paymentPlan: "80/20", bedroomsFrom: 1, bedroomsTo: 3, unitTypes: ["1BR", "2BR", "3BR"], handoverQuarter: "Q1", handoverYear: 2029, rating: 4.6, reviews: 12, gradient: grad(5), tags: ["new-launch", "waterfront", "high-roi"], description: "New launch overlooking the Ras Al Khor wildlife sanctuary and Downtown skyline.", amenities: ["Pool", "Gym", "Cinema"], views: 612, leads: 44, bookings: 4 },
  { id: "p13", slug: "hills-park-villas", name: "Hills Park Villas", developerId: "dev-emaar", communityId: "com-hills", propertyType: "Villas", listingType: "off-plan", status: "published", approvalStatus: "review", featured: false, priceFromAed: 3600000, paymentPlan: "60/40", bedroomsFrom: 4, bedroomsTo: 6, unitTypes: ["4BR", "5BR", "6BR"], handoverQuarter: "Q4", handoverYear: 2027, rating: 4.7, reviews: 8, gradient: grad(0), tags: ["luxury", "villas"], description: "Contemporary family villas facing Dubai Hills Golf Course.", amenities: ["Golf", "Pool", "Gym", "Parking"], views: 540, leads: 38, bookings: 3 },
  { id: "p14", slug: "meydan-canal-villas", name: "Meydan Canal Villas", developerId: "dev-sobha", communityId: "com-meydan", propertyType: "Villas", listingType: "off-plan", status: "draft", approvalStatus: "pending", featured: false, priceFromAed: 5200000, paymentPlan: "70/30", bedroomsFrom: 5, bedroomsTo: 7, unitTypes: ["5BR", "6BR", "7BR"], handoverQuarter: "Q2", handoverYear: 2028, rating: 0, reviews: 0, gradient: grad(1), tags: ["luxury", "waterfront"], description: "Canal-front villas in Meydan with private docks and skyline views.", amenities: ["Pool", "Smart Home", "Parking"], views: 210, leads: 9, bookings: 0 },
  { id: "p15", slug: "arjan-green-residence", name: "Arjan Green Residence", developerId: "dev-binghatti", communityId: "com-arjan", propertyType: "Apartments", listingType: "off-plan", status: "published", approvalStatus: "approved", featured: false, priceFromAed: 720000, paymentPlan: "1/60", bedroomsFrom: 0, bedroomsTo: 2, unitTypes: ["Studio", "1BR", "2BR"], handoverQuarter: "Q3", handoverYear: 2026, rating: 4.2, reviews: 34, gradient: grad(2), tags: ["under-1m", "high-roi"], description: "Affordable apartments moments from Dubai Miracle Garden.", amenities: ["Pool", "Gym"], views: 980, leads: 61, bookings: 9 },
];

export const leads: Lead[] = [
  { id: "l1", name: "James Whitfield", phone: "+44 7911 123456", email: "james.w@example.com", country: "United Kingdom", budgetAed: 1500000, status: "new", projectName: "Chelsea Residences", source: "Website", date: "2026-07-20", assignedAgent: "Fatima Al Marri", notes: "Interested in 2BR, prefers Q4 2027 handover." },
  { id: "l2", name: "Elena Petrova", phone: "+7 916 234 5678", email: "elena.p@example.com", country: "Russia", budgetAed: 2200000, status: "contacted", projectName: "Sobha Hartland II", source: "WhatsApp", date: "2026-07-19", assignedAgent: "Omar Sharif", notes: "Wants payment plan details sent via email." },
  { id: "l3", name: "Wei Zhang", phone: "+86 138 0013 8000", email: "wei.zhang@example.com", country: "China", budgetAed: 3000000, status: "qualified", projectName: "Bay by Cavalli", source: "Property Finder", date: "2026-07-18", assignedAgent: "Fatima Al Marri", notes: "Viewing scheduled next week." },
  { id: "l4", name: "Ahmed Hassan", phone: "+20 100 123 4567", email: "ahmed.h@example.com", country: "Egypt", budgetAed: 900000, status: "new", projectName: "Circle Mansions", source: "Instagram Ads", date: "2026-07-18", assignedAgent: "Layla Haddad", notes: "First-time investor, needs mortgage guidance." },
  { id: "l5", name: "Sara Müller", phone: "+49 151 23456789", email: "sara.m@example.com", country: "Germany", budgetAed: 1750000, status: "won", projectName: "Marina Vista", source: "Referral", date: "2026-07-15", assignedAgent: "Omar Sharif", notes: "Booking confirmed, 10% paid." },
  { id: "l6", name: "Rohan Mehta", phone: "+91 98765 43210", email: "rohan.m@example.com", country: "India", budgetAed: 1200000, status: "contacted", projectName: "Binghatti Skyrise", source: "Website", date: "2026-07-14", assignedAgent: "Layla Haddad", notes: "Comparing with 2 other Business Bay projects." },
  { id: "l7", name: "Fatima Al Suwaidi", phone: "+971 50 123 4567", email: "fatima.s@example.com", country: "UAE", budgetAed: 4500000, status: "qualified", projectName: "Palm Beach Towers", source: "Walk-in", date: "2026-07-12", assignedAgent: "Fatima Al Marri", notes: "Cash buyer, wants sea-facing unit." },
  { id: "l8", name: "Michael Chen", phone: "+1 415 555 0192", email: "michael.c@example.com", country: "USA", budgetAed: 1450000, status: "lost", projectName: "DAMAC Lagoons – Venice", source: "Property Finder", date: "2026-07-10", assignedAgent: "Omar Sharif", notes: "Went with a competitor development." },
  { id: "l9", name: "Nadia Rahman", phone: "+880 1712 345678", email: "nadia.r@example.com", country: "Bangladesh", budgetAed: 780000, status: "new", projectName: "Arjan Green Residence", source: "Facebook Ads", date: "2026-07-09", assignedAgent: "Layla Haddad", notes: "Budget conscious, wants studio." },
  { id: "l10", name: "Luca Romano", phone: "+39 320 1234567", email: "luca.r@example.com", country: "Italy", budgetAed: 2900000, status: "contacted", projectName: "Bay by Cavalli", source: "Referral", date: "2026-07-07", assignedAgent: "Fatima Al Marri", notes: "Interested in Cavalli-branded interiors." },
];

export const bookings: Booking[] = [
  { id: "b1", projectName: "Chelsea Residences", clientName: "James Whitfield", date: "2026-07-24", time: "11:00 AM", agent: "Fatima Al Marri", status: "confirmed" },
  { id: "b2", projectName: "Bay by Cavalli", clientName: "Wei Zhang", date: "2026-07-25", time: "2:30 PM", agent: "Fatima Al Marri", status: "confirmed" },
  { id: "b3", projectName: "Marina Vista", clientName: "Sara Müller", date: "2026-07-20", time: "10:00 AM", agent: "Omar Sharif", status: "completed" },
  { id: "b4", projectName: "Palm Beach Towers", clientName: "Fatima Al Suwaidi", date: "2026-07-26", time: "4:00 PM", agent: "Fatima Al Marri", status: "confirmed" },
  { id: "b5", projectName: "DAMAC Lagoons – Venice", clientName: "Michael Chen", date: "2026-07-17", time: "1:00 PM", agent: "Omar Sharif", status: "cancelled" },
  { id: "b6", projectName: "Binghatti Skyrise", clientName: "Rohan Mehta", date: "2026-07-27", time: "5:30 PM", agent: "Layla Haddad", status: "confirmed" },
  { id: "b7", projectName: "Sobha Hartland II", clientName: "Elena Petrova", date: "2026-07-15", time: "12:00 PM", agent: "Omar Sharif", status: "completed" },
];

export const developerAnalytics: AnalyticsPoint[] = [
  { date: "1 May", views: 8200, leads: 3200 },
  { date: "5 May", views: 9400, leads: 3800 },
  { date: "10 May", views: 11200, leads: 4600 },
  { date: "15 May", views: 10100, leads: 5200 },
  { date: "20 May", views: 13400, leads: 6100 },
  { date: "25 May", views: 15800, leads: 6800 },
  { date: "31 May", views: 18642, leads: 7900 },
];

export const platformLeadsAnalytics: AnalyticsPoint[] = [
  { date: "1 May", views: 0, leads: 5200 },
  { date: "8 May", views: 0, leads: 6400 },
  { date: "15 May", views: 0, leads: 7100 },
  { date: "22 May", views: 0, leads: 8600 },
  { date: "29 May", views: 0, leads: 9800 },
];

export const adminActivity: Activity[] = [
  { id: "a1", text: 'New project "Skyline Heights" added by Sobha Realty', time: "2 mins ago" },
  { id: "a2", text: "New lead from Chelsea Residences", time: "10 mins ago" },
  { id: "a3", text: 'Developer "Azizi Developments" registered', time: "20 mins ago" },
  { id: "a4", text: 'Project "Palm Beach Towers" updated', time: "30 mins ago" },
  { id: "a5", text: "New booking confirmed for Bay by Cavalli", time: "48 mins ago" },
  { id: "a6", text: 'Developer "Ellington Properties" upgraded to Enterprise plan', time: "1 hr ago" },
];

export function getDeveloper(id: string) {
  return developers.find((d) => d.id === id || d.slug === id);
}

export function getCommunity(id: string) {
  return communities.find((c) => c.id === id || c.slug === id);
}

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function projectsForDeveloper(developerId: string) {
  return projects.filter((p) => p.developerId === developerId);
}

export function projectsForCommunity(communityId: string) {
  return projects.filter((p) => p.communityId === communityId);
}

export function formatAed(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `AED ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `AED ${(value / 1000).toFixed(0)}K`;
  }
  return `AED ${value}`;
}
