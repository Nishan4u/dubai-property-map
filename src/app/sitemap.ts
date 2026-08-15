import type { MetadataRoute } from "next";
import {
  getBrokersDirectory,
  getCommunities,
  getDevelopers,
  getProjectSitemapEntries,
  getPublishedBlogPosts,
} from "@/lib/supabase/queries";

const BASE_URL = "https://dubaipropertymap.ae";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, communities, developers, posts, brokers] = await Promise.all([
    getProjectSitemapEntries(),
    getCommunities(),
    getDevelopers(),
    getPublishedBlogPosts(),
    getBrokersDirectory(),
  ]);

  const staticRoutes = [
    "",
    "/projects",
    "/developers",
    "/communities",
    "/brokers",
    "/blog",
    "/compare",
    "/calculators",
    "/invest",
    "/about",
    "/contact",
    "/faq",
    "/advertise",
    "/privacy",
    "/terms",
    "/careers",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${BASE_URL}/projects/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
  }));

  const communityRoutes = communities.map((c) => ({
    url: `${BASE_URL}/communities/${c.slug}`,
    lastModified: new Date(),
  }));

  const developerRoutes = developers.map((d) => ({
    url: `${BASE_URL}/developers/${d.slug}`,
    lastModified: new Date(),
  }));

  const blogRoutes = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
  }));

  // getBrokersDirectory() already reads the public-safe brokers_public_
  // profile view (never raw contact fields) -- the same data the /brokers
  // directory itself renders to guests, so nothing new is exposed here.
  const brokerRoutes = brokers.map((b) => ({
    url: `${BASE_URL}/brokers/${b.slug}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...projectRoutes,
    ...communityRoutes,
    ...developerRoutes,
    ...blogRoutes,
    ...brokerRoutes,
  ];
}
