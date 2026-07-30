// Real, named Dubai points of interest with approximate real-world
// coordinates. Hardcoded rather than pulled from a live POI API (none is
// configured), but every entry is an actual place, not fabricated data.
// Schools/Hospitals/Malls/Airports/Beaches/Golf/Parks sourced from a
// user-provided real POI dataset (dubai_poi_locations.csv). Metro stations
// merge two datasets: dubai_all_metro_lines.csv (operational Red/Green
// lines) and dubai_blue_gold_metro_locations.csv (planned/under-construction
// Blue/Gold lines, approximate coordinates). Each point carries its own
// color by line (Red/Green/Blue/Gold) instead of one flat color for all
// metro pins. Real interchange stations shared by two lines (Centrepoint,
// Union, BurJuman, Business Bay, Jumeirah Golf Estates, Al Gubaiba, Creek)
// are merged into a single pin listing both lines. Blue/Gold stations that
// aren't built yet keep their planning status in the label for honesty.

export interface PoiPoint {
  name: string;
  lng: number;
  lat: number;
  color?: string;
}

export interface PoiLayer {
  key: string;
  label: string;
  color: string;
  /** Mapbox Maki sprite icon name (built into the default styles) used to
   * distinguish this category on the map — colors alone repeat across
   * categories (e.g. hospitals and the metro red line are both red), so
   * shape is what actually disambiguates them. */
  icon: string;
  points: PoiPoint[];
}

export const poiLayers: PoiLayer[] = [
  {
    key: "metro",
    label: "Metro Lines",
    color: "#e11d48",
    icon: "rail-metro",
    points: [
      { name: "Centrepoint (Red Line, Blue Line — Confirmed Interchange)", lng: 55.391, lat: 25.23, color: "#ef4444" },
      { name: "Emirates (Red Line)", lng: 55.366, lat: 25.226, color: "#ef4444" },
      { name: "Airport Terminal 3 (Red Line)", lng: 55.359, lat: 25.245, color: "#ef4444" },
      { name: "Airport Terminal 1 (Red Line)", lng: 55.353, lat: 25.25, color: "#ef4444" },
      { name: "Al Garhoud (Red Line)", lng: 55.339, lat: 25.249, color: "#ef4444" },
      { name: "City Centre Deira (Red Line)", lng: 55.333, lat: 25.251, color: "#ef4444" },
      { name: "Al Rigga (Red Line)", lng: 55.315, lat: 25.262, color: "#ef4444" },
      { name: "Union (Red Line, Green Line)", lng: 55.314, lat: 25.266, color: "#ef4444" },
      { name: "BurJuman (Red Line, Green Line)", lng: 55.305, lat: 25.253, color: "#ef4444" },
      { name: "ADCB (Red Line)", lng: 55.298, lat: 25.244, color: "#ef4444" },
      { name: "max (Red Line)", lng: 55.292, lat: 25.233, color: "#ef4444" },
      { name: "World Trade Center (Red Line)", lng: 55.287, lat: 25.227, color: "#ef4444" },
      { name: "Emirates Towers (Red Line)", lng: 55.28, lat: 25.217, color: "#ef4444" },
      { name: "Financial Centre (Red Line)", lng: 55.275, lat: 25.211, color: "#ef4444" },
      { name: "Burj Khalifa / Dubai Mall (Red Line)", lng: 55.269, lat: 25.201, color: "#ef4444" },
      { name: "Business Bay (Red Line, Gold Line — Confirmed Interchange)", lng: 55.261, lat: 25.191, color: "#ef4444" },
      { name: "ONPASSIVE (Red Line)", lng: 55.25, lat: 25.167, color: "#ef4444" },
      { name: "Equiti (Red Line)", lng: 55.207, lat: 25.14, color: "#ef4444" },
      { name: "Mall of the Emirates (Red Line)", lng: 55.2, lat: 25.12, color: "#ef4444" },
      { name: "InsuranceMarket (Red Line)", lng: 55.191, lat: 25.113, color: "#ef4444" },
      { name: "Dubai Internet City (Red Line)", lng: 55.174, lat: 25.102, color: "#ef4444" },
      { name: "Al Fardan Exchange (Red Line)", lng: 55.159, lat: 25.089, color: "#ef4444" },
      { name: "Sobha Realty (Red Line)", lng: 55.148, lat: 25.081, color: "#ef4444" },
      { name: "DMCC (Red Line)", lng: 55.137, lat: 25.069, color: "#ef4444" },
      { name: "National Paints (Red Line)", lng: 55.127, lat: 25.06, color: "#ef4444" },
      { name: "Ibn Battuta (Red Line)", lng: 55.117, lat: 25.044, color: "#ef4444" },
      { name: "Energy (Red Line)", lng: 55.093, lat: 25.007, color: "#ef4444" },
      { name: "Danube (Red Line)", lng: 55.091, lat: 24.977, color: "#ef4444" },
      { name: "Life Pharmacy (Red Line)", lng: 55.088, lat: 24.972, color: "#ef4444" },
      { name: "The Gardens (Red Line – Route 2020 Extension)", lng: 55.12, lat: 25.038, color: "#ef4444" },
      { name: "Discovery Gardens (Red Line – Route 2020 Extension)", lng: 55.135, lat: 25.038, color: "#ef4444" },
      { name: "Al Furjan (Red Line – Route 2020 Extension)", lng: 55.151, lat: 25.026, color: "#ef4444" },
      { name: "Jumeirah Golf Estates (Red Line – Route 2020 Extension, Gold Line — Confirmed Interchange)", lng: 55.207, lat: 25.003, color: "#ef4444" },
      { name: "Dubai Investment Park (Red Line – Route 2020 Extension)", lng: 55.201, lat: 24.971, color: "#ef4444" },
      { name: "EXPO 2020 (Red Line – Route 2020 Extension)", lng: 55.136, lat: 24.965, color: "#ef4444" },
      { name: "e& (Green Line)", lng: 55.401, lat: 25.285, color: "#22c55e" },
      { name: "Al Qusais (Green Line)", lng: 55.394, lat: 25.276, color: "#22c55e" },
      { name: "Dubai Airport Free Zone (Green Line)", lng: 55.381, lat: 25.27, color: "#22c55e" },
      { name: "Al Nahda (Green Line)", lng: 55.369, lat: 25.273, color: "#22c55e" },
      { name: "Stadium (Green Line)", lng: 55.361, lat: 25.277, color: "#22c55e" },
      { name: "Al Qiyadah (Green Line)", lng: 55.35, lat: 25.275, color: "#22c55e" },
      { name: "Abu Hail (Green Line)", lng: 55.346, lat: 25.276, color: "#22c55e" },
      { name: "Abu Baker Al Siddique (Green Line)", lng: 55.332, lat: 25.27, color: "#22c55e" },
      { name: "Salah Al Din (Green Line)", lng: 55.32, lat: 25.27, color: "#22c55e" },
      { name: "Baniyas Square (Green Line)", lng: 55.307, lat: 25.275, color: "#22c55e" },
      { name: "Gold Souq (Green Line)", lng: 55.3, lat: 25.28, color: "#22c55e" },
      { name: "Al Ras (Green Line)", lng: 55.296, lat: 25.269, color: "#22c55e" },
      { name: "Al Gubaiba (Green Line, Gold Line — Confirmed Interchange)", lng: 55.289, lat: 25.265, color: "#22c55e" },
      { name: "Sharaf DG (Green Line)", lng: 55.297, lat: 25.258, color: "#22c55e" },
      { name: "Oud Metha (Green Line)", lng: 55.315, lat: 25.244, color: "#22c55e" },
      { name: "Dubai Healthcare City (Green Line)", lng: 55.323, lat: 25.231, color: "#22c55e" },
      { name: "Al Jadaf (Green Line)", lng: 55.334, lat: 25.219, color: "#22c55e" },
      { name: "Creek (Green Line, Blue Line — Confirmed Interchange)", lng: 55.35, lat: 25.224, color: "#22c55e" },
      { name: "Dubai Festival City (Blue Line — Planned Area)", lng: 55.359, lat: 25.221, color: "#3b82f6" },
      { name: "Dubai Creek Harbour (Blue Line — Confirmed Area)", lng: 55.359, lat: 25.197, color: "#3b82f6" },
      { name: "Ras Al Khor (Blue Line — Planned Area)", lng: 55.359, lat: 25.188, color: "#3b82f6" },
      { name: "International City 1 (Blue Line — Confirmed Interchange Area)", lng: 55.407, lat: 25.166, color: "#3b82f6" },
      { name: "International City 2 (Blue Line — Planned Area)", lng: 55.42, lat: 25.16, color: "#3b82f6" },
      { name: "International City 3 (Blue Line — Planned Area)", lng: 55.43, lat: 25.155, color: "#3b82f6" },
      { name: "Dubai Silicon Oasis (Blue Line — Planned Area)", lng: 55.377, lat: 25.122, color: "#3b82f6" },
      { name: "Dubai Academic City (Blue Line — Planned Area)", lng: 55.414, lat: 25.113, color: "#3b82f6" },
      { name: "Al Warqa (Blue Line — Planned Area)", lng: 55.411, lat: 25.193, color: "#3b82f6" },
      { name: "Mirdif (Blue Line — Planned Area)", lng: 55.421, lat: 25.219, color: "#3b82f6" },
      { name: "Mina Rashid (Gold Line — Confirmed Route Area)", lng: 55.276, lat: 25.266, color: "#eab308" },
      { name: "City Walk (Gold Line — Confirmed Route Area)", lng: 55.263, lat: 25.207, color: "#eab308" },
      { name: "Mohammed Bin Rashid City (Gold Line — Confirmed Route Area)", lng: 55.305, lat: 25.168, color: "#eab308" },
      { name: "Nad Al Sheba (Gold Line — Confirmed Route Area)", lng: 55.36, lat: 25.155, color: "#eab308" },
      { name: "Mohammed Bin Rashid Gardens (Gold Line — Route Area)", lng: 55.33, lat: 25.145, color: "#eab308" },
      { name: "Meydan (Gold Line — Confirmed Etihad Rail Connection)", lng: 55.3, lat: 25.164, color: "#eab308" },
      { name: "Al Barsha South (Gold Line — Confirmed Route Area)", lng: 55.23, lat: 25.07, color: "#eab308" },
      { name: "Jumeirah Village Circle (JVC) (Gold Line — Confirmed Route Area)", lng: 55.209, lat: 25.054, color: "#eab308" }
    ],
  },
  {
    key: "schools",
    label: "Schools",
    color: "#3b82f6",
    icon: "school",
    points: [
      { name: "Kings' School Dubai", lng: 55.1988, lat: 25.1518 },
      { name: "Dubai College", lng: 55.1768, lat: 25.1099 },
      { name: "GEMS Dubai American Academy", lng: 55.2229, lat: 25.0708 },
      { name: "Dubai British School", lng: 55.1704, lat: 25.0834 },
      { name: "Dubai International Academy", lng: 55.174, lat: 25.088 },
      { name: "Jumeirah English Speaking School", lng: 55.2384, lat: 25.1818 },
      { name: "Deira International School", lng: 55.371, lat: 25.215 },
      { name: "GEMS Modern Academy", lng: 55.377, lat: 25.154 },
      { name: "Nord Anglia International School Dubai", lng: 55.2216, lat: 25.0628 },
      { name: "Dubai Schools Al Barsha", lng: 55.233, lat: 25.074 },
    ],
  },
  {
    key: "hospitals",
    label: "Hospitals",
    color: "#ef4444",
    icon: "hospital",
    points: [
      { name: "Dubai Hospital", lng: 55.321, lat: 25.285 },
      { name: "Rashid Hospital", lng: 55.315, lat: 25.249 },
      { name: "American Hospital Dubai", lng: 55.3135, lat: 25.2335 },
      { name: "Mediclinic City Hospital", lng: 55.322, lat: 25.228 },
      { name: "King's College Hospital Dubai", lng: 55.238, lat: 25.111 },
      { name: "Saudi German Hospital Dubai", lng: 55.202, lat: 25.0995 },
      { name: "Al Zahra Hospital Dubai", lng: 55.183, lat: 25.1 },
      { name: "Emirates Specialty Hospital", lng: 55.324, lat: 25.233 },
      { name: "International Modern Hospital", lng: 55.288, lat: 25.25 },
    ],
  },
  {
    key: "malls",
    label: "Malls",
    color: "#a855f7",
    icon: "shop",
    points: [
      { name: "Dubai Mall", lng: 55.2796, lat: 25.1985 },
      { name: "Mall of the Emirates", lng: 55.2006, lat: 25.1181 },
      { name: "Dubai Hills Mall", lng: 55.239, lat: 25.1 },
      { name: "Dubai Marina Mall", lng: 55.14, lat: 25.077 },
      { name: "Ibn Battuta Mall", lng: 55.117, lat: 25.044 },
      { name: "City Centre Deira", lng: 55.332, lat: 25.251 },
      { name: "City Centre Mirdif", lng: 55.408, lat: 25.216 },
      { name: "Dubai Festival City Mall", lng: 55.361, lat: 25.217 },
      { name: "Nakheel Mall", lng: 55.1395, lat: 25.1135 },
      { name: "Circle Mall", lng: 55.213, lat: 25.055 },
      { name: "Mercato Shopping Mall", lng: 55.253, lat: 25.216 },
      { name: "Wafi City", lng: 55.319, lat: 25.229 },
    ],
  },
  {
    key: "airports",
    label: "Airports",
    color: "#0ea5e9",
    icon: "airport",
    points: [
      { name: "Dubai International Airport (DXB)", lng: 55.3657, lat: 25.2532 },
      { name: "Al Maktoum International Airport (DWC)", lng: 55.1614, lat: 24.8964 },
    ],
  },
  {
    key: "beaches",
    label: "Beaches",
    color: "#06b6d4",
    icon: "beach",
    points: [
      { name: "Jumeira Public Beach", lng: 55.255, lat: 25.218 },
      { name: "JBR Beach", lng: 55.132, lat: 25.078 },
      { name: "Kite Beach", lng: 55.209, lat: 25.162 },
      { name: "Umm Suqeim Night Swimming Beach", lng: 55.193, lat: 25.144 },
      { name: "Al Mamzar Beach", lng: 55.349, lat: 25.316 },
      { name: "Marina Beach", lng: 55.13, lat: 25.075 },
      { name: "Black Palace Beach", lng: 55.163, lat: 25.104 },
      { name: "La Mer / J1 Beach", lng: 55.255, lat: 25.229 },
    ],
  },
  {
    key: "golf",
    label: "Golf Courses",
    color: "#22c55e",
    icon: "golf",
    points: [
      { name: "Emirates Golf Club", lng: 55.159, lat: 25.085 },
      { name: "Dubai Creek Golf & Yacht Club", lng: 55.333, lat: 25.242 },
      { name: "Jumeirah Golf Estates", lng: 55.203, lat: 25.021 },
      { name: "Dubai Hills Golf Club", lng: 55.255, lat: 25.1 },
      { name: "Trump International Golf Club", lng: 55.245, lat: 25.026 },
      { name: "Arabian Ranches Golf Club", lng: 55.269, lat: 25.054 },
      { name: "The Els Club", lng: 55.221, lat: 25.037 },
      { name: "The Track, Meydan Golf", lng: 55.302, lat: 25.155 },
    ],
  },
  {
    key: "parks",
    label: "Parks",
    color: "#84cc16",
    icon: "park",
    points: [
      { name: "Zabeel Park", lng: 55.297, lat: 25.235 },
      { name: "Burj Park", lng: 55.273, lat: 25.195 },
      { name: "Dubai Hills Park", lng: 55.247, lat: 25.111 },
      { name: "Safa Park", lng: 55.244, lat: 25.185 },
      { name: "Mushrif Park", lng: 55.451, lat: 25.217 },
      { name: "Al Mamzar Beach Park", lng: 55.349, lat: 25.317 },
      { name: "Creek Park", lng: 55.326, lat: 25.239 },
      { name: "Quranic Park", lng: 55.493, lat: 25.235 },
      { name: "Al Barsha Pond Park", lng: 55.203, lat: 25.105 },
      { name: "Dubai Miracle Garden", lng: 55.244, lat: 25.06 },
    ],
  },
  {
    key: "restaurants",
    label: "Restaurants",
    color: "#f97316",
    icon: "restaurant",
    points: [
      { name: "Pierchic (Madinat Jumeirah)", lng: 55.1858, lat: 25.1306 },
      { name: "Al Mahara (Burj Al Arab)", lng: 55.1853, lat: 25.1413 },
      { name: "Zuma Dubai (DIFC)", lng: 55.2788, lat: 25.2138 },
      { name: "CE LA VI Dubai (Downtown)", lng: 55.2744, lat: 25.19 },
      { name: "At.mosphere (Burj Khalifa)", lng: 55.2744, lat: 25.1972 },
      { name: "Nobu Dubai (Atlantis The Palm)", lng: 55.117, lat: 25.1306 },
      { name: "Ravi Restaurant (Satwa)", lng: 55.2705, lat: 25.227 },
      { name: "Bu Qtair (Jumeirah)", lng: 55.1868, lat: 25.14 },
    ],
  },
  {
    key: "attractions",
    label: "Attractions",
    color: "#eab308",
    icon: "attraction",
    points: [
      { name: "Burj Khalifa", lng: 55.2744, lat: 25.1972 },
      { name: "The Dubai Fountain", lng: 55.276, lat: 25.1958 },
      { name: "Museum of the Future", lng: 55.2839, lat: 25.2216 },
      { name: "Dubai Frame", lng: 55.3005, lat: 25.2354 },
      { name: "Atlantis, The Palm", lng: 55.1172, lat: 25.1308 },
      { name: "Dubai Marina Walk", lng: 55.14, lat: 25.08 },
      { name: "Global Village", lng: 55.3086, lat: 25.0693 },
      { name: "IMG Worlds of Adventure", lng: 55.4028, lat: 25.1712 },
    ],
  },
];

export interface PoiLine {
  name: string;
  color: string;
  coordinates: [number, number][];
}

const metroLineNames: Record<string, string> = {
  "#ef4444": "Red Line",
  "#22c55e": "Green Line",
  "#3b82f6": "Blue Line (Planned)",
  "#eab308": "Gold Line (Planned)",
};

// Connects the metro station points above into real line paths, colored by
// line. Built from the same station list (not a separate hand-copied
// dataset) so the two can never drift apart. Stations are listed in
// physical sequence per line, so a straight connect-the-dots per color
// works (Blue Line's stations were reordered above -- Al Warqa before
// Mirdif -- to match a sane path instead of the doubling-back order they
// were originally entered in). Red also forks at Ibn Battuta for the
// Route 2020 extension -- handled as its own segment sharing Ibn Battuta's
// coordinate as the branch point, rather than one continuous line, so the
// fork renders correctly instead of a diagonal jump across the map.
function buildMetroLines(): PoiLine[] {
  const metroPoints = poiLayers.find((l) => l.key === "metro")!.points;
  const ibnBattuta = metroPoints.find((p) => p.name.startsWith("Ibn Battuta"));
  const lines: PoiLine[] = [];
  let current: PoiLine | null = null;

  for (const pt of metroPoints) {
    const color = pt.color ?? "#94a3b8";

    const isRoute2020 = pt.name.includes("Route 2020 Extension");
    if (isRoute2020 && current?.name !== "Red Line (Route 2020 Extension)") {
      current = {
        name: "Red Line (Route 2020 Extension)",
        color,
        coordinates: ibnBattuta ? [[ibnBattuta.lng, ibnBattuta.lat]] : [],
      };
      lines.push(current);
    } else if (!isRoute2020 && (!current || current.color !== color || current.name.includes("Route 2020"))) {
      current = { name: metroLineNames[color] ?? "Metro Line", color, coordinates: [] };
      lines.push(current);
    }
    current!.coordinates.push([pt.lng, pt.lat]);
  }

  return lines;
}

export const metroLines: PoiLine[] = buildMetroLines();

// Approximate real routes for Dubai's major highways (a handful of waypoints
// each, not full precision), used only to draw a recognizable line on the
// map -- same "real place, approximate coordinates" spirit as the POI
// points above.
export const highwayLines: PoiLine[] = [
  {
    name: "Sheikh Zayed Road (E11)",
    color: "#f59e0b",
    coordinates: [
      [55.02, 24.985],
      [55.08, 25.035],
      [55.14, 25.075],
      [55.19, 25.115],
      [55.23, 25.145],
      [55.27, 25.19],
      [55.29, 25.225],
      [55.31, 25.26],
    ],
  },
  {
    name: "Al Khail Road",
    color: "#38bdf8",
    coordinates: [
      [55.145, 25.02],
      [55.185, 25.06],
      [55.22, 25.1],
      [55.245, 25.14],
      [55.27, 25.18],
      [55.3, 25.21],
    ],
  },
  {
    name: "Sheikh Mohammed Bin Zayed Road",
    color: "#a78bfa",
    coordinates: [
      [55.3, 24.95],
      [55.33, 25.02],
      [55.36, 25.08],
      [55.38, 25.15],
      [55.4, 25.22],
      [55.42, 25.28],
    ],
  },
  {
    name: "Al Ain Road",
    color: "#4ade80",
    coordinates: [
      [55.34, 25.12],
      [55.4, 25.12],
      [55.45, 25.05],
      [55.5, 24.95],
    ],
  },
];
