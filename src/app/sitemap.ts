import type { MetadataRoute } from "next";
import {
  getCommunities,
  getDevelopers,
  getProjectSitemapEntries,
  getPublishedBlogPosts,
} from "@/lib/supabase/queries";

const BASE_URL = "https://dubaipropertymap.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, communities, developers, posts] = await Promise.all([
    getProjectSitemapEntries(),
    getCommunities(),
    getDevelopers(),
    getPublishedBlogPosts(),
  ]);

  const staticRoutes = [
    "",
    "/developers",
    "/communities",
    "/blog",
    "/compare",
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

  return [...staticRoutes, ...projectRoutes, ...communityRoutes, ...developerRoutes, ...blogRoutes];
}
