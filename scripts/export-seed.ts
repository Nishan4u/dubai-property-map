// One-off script: converts src/data/mock.ts into a SQL seed file.
// Run with: npx tsx scripts/export-seed.ts > supabase/seed.sql
import {
  developers,
  communities,
  projects,
  leads,
  bookings,
} from "../src/data/mock";

function sqlStr(v: string | null | undefined) {
  if (v === null || v === undefined) return "null";
  return `'${v.replace(/'/g, "''")}'`;
}

function sqlArr(v: string[]) {
  if (!v.length) return "'{}'";
  return `ARRAY[${v.map((x) => sqlStr(x)).join(",")}]::text[]`;
}

function sqlNum(v: number | null | undefined) {
  return v === null || v === undefined ? "null" : String(v);
}

function sqlBool(v: boolean) {
  return v ? "true" : "false";
}

const lines: string[] = [];
lines.push("-- Generated from src/data/mock.ts — run after schema.sql");
lines.push("");

lines.push("insert into developers (id, slug, name, initial, color, verified, founded, description, status) values");
lines.push(
  developers
    .map(
      (d, i) =>
        `  (gen_random_uuid(), ${sqlStr(d.slug)}, ${sqlStr(d.name)}, ${sqlStr(d.initial)}, ${sqlStr(d.color)}, ${sqlBool(d.verified)}, ${sqlNum(d.founded)}, ${sqlStr(d.description)}, 'active')${i === developers.length - 1 ? ";" : ","}`
    )
    .join("\n")
);
lines.push("");

lines.push("insert into communities (id, slug, name, description, lng, lat, x_pct, y_pct, pin_color) values");
lines.push(
  communities
    .map(
      (c, i) =>
        `  (gen_random_uuid(), ${sqlStr(c.slug)}, ${sqlStr(c.name)}, ${sqlStr(c.description)}, ${sqlNum(c.lng)}, ${sqlNum(c.lat)}, ${sqlNum(c.xPct)}, ${sqlNum(c.yPct)}, ${sqlStr(c.pinColor)})${i === communities.length - 1 ? ";" : ","}`
    )
    .join("\n")
);
lines.push("");

lines.push(`-- Projects reference developers/communities by slug via subselects`);
lines.push("insert into projects (id, slug, name, developer_id, community_id, property_type, listing_type, status, approval_status, featured, price_from_aed, payment_plan, bedrooms_from, bedrooms_to, unit_types, handover_quarter, handover_year, rating, reviews, gradient, tags, description, amenities, views) values");
lines.push(
  projects
    .map((p, i) => {
      const devSlug = developers.find((d) => d.id === p.developerId)?.slug;
      const comSlug = communities.find((c) => c.id === p.communityId)?.slug;
      return `  (gen_random_uuid(), ${sqlStr(p.slug)}, ${sqlStr(p.name)}, (select id from developers where slug = ${sqlStr(devSlug)}), (select id from communities where slug = ${sqlStr(comSlug)}), ${sqlStr(p.propertyType)}, ${sqlStr(p.listingType)}, ${sqlStr(p.status)}, ${sqlStr(p.approvalStatus)}, ${sqlBool(p.featured)}, ${sqlNum(p.priceFromAed)}, ${sqlStr(p.paymentPlan)}, ${sqlNum(p.bedroomsFrom)}, ${sqlNum(p.bedroomsTo)}, ${sqlArr(p.unitTypes)}, ${sqlStr(p.handoverQuarter)}, ${sqlNum(p.handoverYear)}, ${sqlNum(p.rating)}, ${sqlNum(p.reviews)}, ${sqlStr(p.gradient)}, ${sqlArr(p.tags)}, ${sqlStr(p.description)}, ${sqlArr(p.amenities)}, ${sqlNum(p.views)})${i === projects.length - 1 ? ";" : ","}`;
    })
    .join("\n")
);
lines.push("");

lines.push("insert into leads (id, project_id, name, phone, email, country, budget_aed, status, source, assigned_agent, notes) values");
lines.push(
  leads
    .map((l, i) => {
      const projSlug = projects.find((p) => p.name === l.projectName)?.slug;
      return `  (gen_random_uuid(), (select id from projects where slug = ${sqlStr(projSlug)}), ${sqlStr(l.name)}, ${sqlStr(l.phone)}, ${sqlStr(l.email)}, ${sqlStr(l.country)}, ${sqlNum(l.budgetAed)}, ${sqlStr(l.status)}, ${sqlStr(l.source)}, ${sqlStr(l.assignedAgent)}, ${sqlStr(l.notes)})${i === leads.length - 1 ? ";" : ","}`;
    })
    .join("\n")
);
lines.push("");

lines.push("insert into bookings (id, project_id, client_name, scheduled_date, scheduled_time, agent, status) values");
lines.push(
  bookings
    .map((b, i) => {
      const projSlug = projects.find((p) => p.name === b.projectName)?.slug;
      return `  (gen_random_uuid(), (select id from projects where slug = ${sqlStr(projSlug)}), ${sqlStr(b.clientName)}, ${sqlStr(b.date)}, ${sqlStr(b.time)}, ${sqlStr(b.agent)}, ${sqlStr(b.status)})${i === bookings.length - 1 ? ";" : ","}`;
    })
    .join("\n")
);
lines.push("");

console.log(lines.join("\n"));
