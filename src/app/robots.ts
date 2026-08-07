import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/account", "/auth"],
    },
    sitemap: "https://dubaipropertymap.ae/sitemap.xml",
  };
}
