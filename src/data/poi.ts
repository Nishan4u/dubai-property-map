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
      { name: "Emirates (Red Line)", lng: 55.3656, lat: 25.2410, color: "#ef4444" },
      { name: "Airport Terminal 3 (Red Line)", lng: 55.359, lat: 25.245, color: "#ef4444" },
      { name: "Airport Terminal 1 (Red Line)", lng: 55.353, lat: 25.25, color: "#ef4444" },
      { name: "GGICO (Red Line)", lng: 55.3400, lat: 25.2495, color: "#ef4444" },
      { name: "City Centre Deira (Red Line)", lng: 55.333, lat: 25.251, color: "#ef4444" },
      { name: "Al Rigga (Red Line)", lng: 55.315, lat: 25.262, color: "#ef4444" },
      { name: "Union (Red Line, Green Line)", lng: 55.314, lat: 25.266, color: "#ef4444" },
      { name: "BurJuman (Red Line, Green Line)", lng: 55.3043, lat: 25.2547, color: "#ef4444" },
      { name: "ADCB (Red Line)", lng: 55.298, lat: 25.244, color: "#ef4444" },
      { name: "Max (Red Line)", lng: 55.292, lat: 25.233, color: "#ef4444" },
      { name: "World Trade Centre (Red Line)", lng: 55.2850, lat: 25.2248, color: "#ef4444" },
      { name: "Emirates Towers (Red Line)", lng: 55.28, lat: 25.217, color: "#ef4444" },
      { name: "Financial Centre (Red Line)", lng: 55.2756, lat: 25.2112, color: "#ef4444" },
      { name: "Burj Khalifa / Dubai Mall (Red Line)", lng: 55.2695, lat: 25.2014, color: "#ef4444" },
      { name: "Business Bay (Red Line, Gold Line — Confirmed Interchange)", lng: 55.261, lat: 25.191, color: "#ef4444" },
      { name: "ONPASSIVE (Red Line)", lng: 55.2285, lat: 25.1558, color: "#ef4444" },
      { name: "Equiti (Red Line)", lng: 55.2075, lat: 25.1264, color: "#ef4444" },
      { name: "Mall of the Emirates (Red Line)", lng: 55.1999, lat: 25.1219, color: "#ef4444" },
      { name: "Mashreq (Red Line)", lng: 55.191, lat: 25.113, color: "#ef4444" },
      { name: "Dubai Internet City (Red Line)", lng: 55.174, lat: 25.102, color: "#ef4444" },
      { name: "Al Khail (Red Line)", lng: 55.1581, lat: 25.0887, color: "#ef4444" },
      { name: "Sobha Realty (Red Line)", lng: 55.148, lat: 25.081, color: "#ef4444" },
      { name: "DMCC (Red Line)", lng: 55.137, lat: 25.069, color: "#ef4444" },
      { name: "Jabal Ali (Red Line)", lng: 55.127, lat: 25.06, color: "#ef4444" },
      { name: "Ibn Battuta (Red Line)", lng: 55.1175, lat: 25.0468, color: "#ef4444" },
      { name: "Energy (Red Line)", lng: 55.093, lat: 25.007, color: "#ef4444" },
      { name: "Danube (Red Line)", lng: 55.091, lat: 24.977, color: "#ef4444" },
      { name: "UAE Exchange (Red Line)", lng: 55.088, lat: 24.972, color: "#ef4444" },
      { name: "The Gardens (Red Line – Route 2020 Branch)", lng: 55.1348, lat: 25.0438, color: "#ef4444" },
      { name: "Discovery Gardens (Red Line – Route 2020 Branch)", lng: 55.1454, lat: 25.0352, color: "#ef4444" },
      { name: "Al Furjan (Red Line – Route 2020 Branch)", lng: 55.1522, lat: 25.0304, color: "#ef4444" },
      { name: "Jumeirah Golf Estates (Red Line – Route 2020 Branch, Gold Line — Confirmed Interchange)", lng: 55.1637, lat: 25.0175, color: "#ef4444" },
      { name: "Dubai Investment Park (Red Line – Route 2020 Branch)", lng: 55.1557, lat: 25.0055, color: "#ef4444" },
      { name: "Expo City Dubai (Red Line – Route 2020 Branch)", lng: 55.1469, lat: 24.963, color: "#ef4444" },
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
      { name: "Al Ghubaiba (Green Line, Gold Line — Confirmed Interchange)", lng: 55.2891, lat: 25.2649, color: "#22c55e" },
      { name: "Sharaf DG (Green Line)", lng: 55.297, lat: 25.258, color: "#22c55e" },
      { name: "Oud Metha (Green Line)", lng: 55.315, lat: 25.244, color: "#22c55e" },
      { name: "Dubai Healthcare City (Green Line)", lng: 55.323, lat: 25.231, color: "#22c55e" },
      { name: "Al Jadaf (Green Line)", lng: 55.334, lat: 25.219, color: "#22c55e" },
      { name: "Creek (Green Line, Blue Line — Confirmed Interchange)", lng: 55.35, lat: 25.224, color: "#22c55e" },
      { name: "Dubai Festival City (Blue Line — Planned Area)", lng: 55.359, lat: 25.221, color: "#3b82f6" },
      { name: "Dubai Creek Harbour (Blue Line — Confirmed Area)", lng: 55.3478, lat: 25.2067, color: "#3b82f6" },
      { name: "Ras Al Khor (Blue Line — Planned Area)", lng: 55.359, lat: 25.188, color: "#3b82f6" },
      { name: "International City 1 (Blue Line — Confirmed Interchange Area)", lng: 55.407, lat: 25.166, color: "#3b82f6" },
      { name: "International City 2 (Blue Line — Planned Area)", lng: 55.42, lat: 25.16, color: "#3b82f6" },
      { name: "International City 3 (Blue Line — Planned Area)", lng: 55.43, lat: 25.155, color: "#3b82f6" },
      { name: "Dubai Silicon Oasis (Blue Line — Planned Area)", lng: 55.377, lat: 25.122, color: "#3b82f6" },
      { name: "Dubai Academic City (Blue Line — Planned Area)", lng: 55.414, lat: 25.113, color: "#3b82f6" },
      // Blue Line is Y-shaped, not one continuous line -- this second branch
      // starts at Centrepoint (Red Line interchange) and rejoins the main
      // Creek branch at International City, it does not continue past
      // Dubai Academic City. Centrepoint and International City 1 are
      // duplicated here (same coordinates as their entries above) so this
      // branch renders as its own connected segment instead of the line
      // wrongly doubling back from Academic City.
      { name: "Centrepoint (Blue Line — Centrepoint Branch, Red Line Interchange)", lng: 55.391, lat: 25.23, color: "#3b82f6" },
      { name: "Mirdif (Blue Line — Centrepoint Branch)", lng: 55.421, lat: 25.219, color: "#3b82f6" },
      { name: "Al Warqa (Blue Line — Centrepoint Branch)", lng: 55.411, lat: 25.193, color: "#3b82f6" },
      { name: "International City 1 (Blue Line — Centrepoint Branch, Interchange)", lng: 55.407, lat: 25.166, color: "#3b82f6" },
      // Officially announced station areas (Gold Line, planned 2032) --
      // ordered by nearest-neighbor geographic proximity rather than the
      // order they were announced in, so the connected line traces a
      // coherent path instead of zig-zagging. Al Ghubaiba and Business Bay
      // are duplicated here (gold-colored) at the same coordinates as
      // their Green/Red Line entries above so the connect-same-color-
      // points logic includes them in this line too.
      { name: "Al Ghubaiba (Gold Line — Confirmed Interchange)", lng: 55.2891, lat: 25.2649, color: "#eab308" },
      { name: "Bur Dubai (Gold Line — Announced Area)", lng: 55.296, lat: 25.255, color: "#eab308" },
      { name: "Al Satwa (Gold Line — Announced Area)", lng: 55.274, lat: 25.229, color: "#eab308" },
      { name: "Business Bay (Gold Line — Confirmed Interchange)", lng: 55.261, lat: 25.191, color: "#eab308" },
      { name: "Al Quoz (Gold Line — Announced Area)", lng: 55.2561, lat: 25.1542, color: "#eab308" },
      { name: "Dubai Hills (Gold Line — Announced Area)", lng: 55.246, lat: 25.1135, color: "#eab308" },
      { name: "Jumeirah Village Circle (JVC) (Gold Line — Announced Area)", lng: 55.2094, lat: 25.0544, color: "#eab308" },
      { name: "Jumeirah Village Triangle (JVT) (Gold Line — Announced Area)", lng: 55.1815, lat: 25.0432, color: "#eab308" },
      { name: "Jumeirah Golf Estates (Gold Line — Announced Area, Red Line Interchange)", lng: 55.1637, lat: 25.0175, color: "#eab308" },
      { name: "Tilal Al Ghaf (Gold Line — Announced Area)", lng: 55.2265, lat: 25.0208, color: "#eab308" },
      { name: "Global Village (Gold Line — Announced Area)", lng: 55.3084, lat: 25.0717, color: "#eab308" },
      { name: "Dubailand (Gold Line — Announced Area)", lng: 55.32, lat: 25.08, color: "#eab308" },
      { name: "Meydan (Gold Line — Announced Area)", lng: 55.3003, lat: 25.1636, color: "#eab308" },
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
// works. Both Red and Blue are Y-shaped rather than one continuous line --
// Red forks at Ibn Battuta for the Route 2020 branch, Blue forks at
// International City for the Centrepoint branch -- each handled as its own
// segment (sharing the fork/join station's coordinate) so the branch
// renders as a real fork instead of the trunk line doubling back on itself.
function buildMetroLines(): PoiLine[] {
  const metroPoints = poiLayers.find((l) => l.key === "metro")!.points;
  const ibnBattuta = metroPoints.find((p) => p.name.startsWith("Ibn Battuta"));
  const lines: PoiLine[] = [];
  let current: PoiLine | null = null;

  for (const pt of metroPoints) {
    const color = pt.color ?? "#94a3b8";

    const isRoute2020 = pt.name.includes("Route 2020 Branch");
    const isCentrepointBranch = pt.name.includes("Centrepoint Branch");
    if (isRoute2020 && current?.name !== "Red Line (Route 2020 Branch)") {
      current = {
        name: "Red Line (Route 2020 Branch)",
        color,
        coordinates: ibnBattuta ? [[ibnBattuta.lng, ibnBattuta.lat]] : [],
      };
      lines.push(current);
    } else if (isCentrepointBranch && current?.name !== "Blue Line (Centrepoint Branch)") {
      current = { name: "Blue Line (Centrepoint Branch)", color, coordinates: [] };
      lines.push(current);
    } else if (
      !isRoute2020 &&
      !isCentrepointBranch &&
      (!current ||
        current.color !== color ||
        current.name.includes("Route 2020") ||
        current.name.includes("Centrepoint Branch"))
    ) {
      current = { name: metroLineNames[color] ?? "Metro Line", color, coordinates: [] };
      lines.push(current);
    }
    current!.coordinates.push([pt.lng, pt.lat]);
  }

  return lines;
}

export const metroLines: PoiLine[] = buildMetroLines();

// Real road-following geometry for Dubai's major highways -- fetched once
// from the Mapbox Directions API between the verified anchor points (see
// git history for the fetch script) and downsampled to ~45 points each, not
// hand-estimated waypoints. This traces the actual curve of each road
// (interchange loops, bends) rather than straight segments between a
// handful of guessed points.
export const highwayLines: PoiLine[] = [
  {
    name: "Sheikh Zayed Road (E11)",
    color: "#f59e0b",
    coordinates: [
      [55.0276, 24.9857], [55.0312, 24.9836], [55.0318, 24.9826], [55.0393, 24.9701], [55.0413, 24.9663],
      [55.0441, 24.9644], [55.0539, 24.955], [55.0634, 24.9457], [55.0625, 24.9443], [55.0609, 24.9452],
      [55.0619, 24.9465], [55.0669, 24.9484], [55.0728, 24.9515], [55.0777, 24.9561], [55.0888, 24.9737],
      [55.0941, 24.9934], [55.1004, 25.0254], [55.1112, 25.0401], [55.1414, 25.0743], [55.1482, 25.0806],
      [55.1503, 25.0815], [55.1541, 25.0827], [55.1541, 25.0867], [55.1526, 25.089], [55.1495, 25.0917],
      [55.15, 25.0925], [55.1518, 25.0912], [55.1521, 25.0904], [55.1524, 25.0889], [55.1516, 25.0863],
      [55.1526, 25.0833], [55.1521, 25.0817], [55.1505, 25.0821], [55.1531, 25.085], [55.177, 25.1053],
      [55.2082, 25.1272], [55.2192, 25.1413], [55.2465, 25.1767], [55.2685, 25.2014], [55.2853, 25.2256],
      [55.2858, 25.2257], [55.2845, 25.2241], [55.283, 25.2216], [55.2829, 25.221], [55.2838, 25.2206],
    ],
  },
  {
    name: "Al Khail Road",
    color: "#38bdf8",
    coordinates: [
      [55.1398, 24.9798], [55.1377, 24.9786], [55.1345, 24.9795], [55.1314, 24.9808], [55.1322, 24.9891],
      [55.1273, 24.9939], [55.1288, 24.9979], [55.1323, 25.0026], [55.1344, 25.0088], [55.1366, 25.0125],
      [55.1396, 25.0157], [55.1406, 25.0166], [55.1471, 25.0175], [55.1553, 25.0172], [55.1601, 25.0159],
      [55.1621, 25.0211], [55.1653, 25.0255], [55.1862, 25.0398], [55.1964, 25.0423], [55.2018, 25.0431],
      [55.2014, 25.0421], [55.2004, 25.043], [55.1962, 25.0505], [55.1955, 25.0544], [55.1961, 25.0589],
      [55.1988, 25.0634], [55.207, 25.0726], [55.2204, 25.0877], [55.2358, 25.105], [55.2575, 25.131],
      [55.2613, 25.1435], [55.2617, 25.1583], [55.263, 25.163], [55.2707, 25.1719], [55.2774, 25.1778],
      [55.2826, 25.1806], [55.2861, 25.1825], [55.2957, 25.1948], [55.3027, 25.1995], [55.3137, 25.2047],
      [55.3264, 25.2169], [55.3361, 25.2198], [55.3369, 25.2194], [55.3389, 25.2174], [55.3401, 25.2156],
    ],
  },
  {
    name: "Sheikh Mohammed Bin Zayed Road (E311)",
    color: "#a78bfa",
    coordinates: [
      [55.3007, 24.9533], [55.3074, 24.9517], [55.3329, 24.95], [55.3441, 24.9492], [55.343, 24.9502],
      [55.3411, 24.9621], [55.3314, 24.9799], [55.3064, 25.0002], [55.2807, 25.0224], [55.2571, 25.0388],
      [55.2499, 25.0517], [55.278, 25.0591], [55.318, 25.0859], [55.3501, 25.1122], [55.3659, 25.1178],
      [55.3656, 25.122], [55.3593, 25.1269], [55.3409, 25.15], [55.3305, 25.148], [55.3374, 25.1494],
      [55.3396, 25.1387], [55.3338, 25.1281], [55.3326, 25.1121], [55.3214, 25.1145], [55.3025, 25.1289],
      [55.2963, 25.1242], [55.2921, 25.1311], [55.298, 25.1408], [55.289, 25.1417], [55.2807, 25.1533],
      [55.2703, 25.1662], [55.27, 25.1706], [55.2769, 25.1768], [55.2831, 25.1807], [55.2957, 25.1948],
      [55.3109, 25.2023], [55.3388, 25.2219], [55.3579, 25.2265], [55.3777, 25.23], [55.3871, 25.2552],
      [55.3954, 25.2693], [55.3971, 25.2818], [55.4073, 25.2941], [55.4271, 25.2865], [55.42, 25.2797],
    ],
  },
  {
    name: "Al Ain Road",
    color: "#4ade80",
    coordinates: [
      [55.363, 25.2014], [55.3618, 25.1998], [55.3611, 25.1946], [55.3602, 25.1925], [55.3596, 25.1919],
      [55.3597, 25.1907], [55.3596, 25.1887], [55.3588, 25.1878], [55.3541, 25.1865], [55.3307, 25.1853],
      [55.3251, 25.1847], [55.3153, 25.1811], [55.3123, 25.1815], [55.3132, 25.1822], [55.3187, 25.1769],
      [55.3234, 25.171], [55.334, 25.1576], [55.3657, 25.1187], [55.3971, 25.0812], [55.4136, 25.0617],
      [55.4164, 25.0602], [55.4279, 25.0594], [55.4413, 25.0645], [55.4506, 25.0715], [55.4592, 25.0818],
      [55.4508, 25.0871], [55.452, 25.0902], [55.446, 25.0973], [55.4327, 25.1133], [55.4332, 25.1149],
      [55.4418, 25.1212], [55.4429, 25.1227], [55.407, 25.0977], [55.3912, 25.0871], [55.3899, 25.0878],
      [55.3925, 25.0866], [55.4129, 25.0629], [55.4396, 25.0371], [55.4577, 25.0149], [55.495, 24.9635],
      [55.5194, 24.927], [55.5452, 24.8827], [55.5461, 24.8833], [55.541, 24.8912], [55.5504, 24.8972],
    ],
  },
];
