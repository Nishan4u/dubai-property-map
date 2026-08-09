import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /present and /sign are private, unguessable-token share links (a
      // branded agent presentation and a contract signing page) meant
      // only for the specific recipient the link was sent to -- never
      // meant to be publicly discoverable via search. /reset-password and
      // /invite/accept carry a token too. None of these are ever linked
      // from any crawlable page, so disallowing them here is
      // belt-and-braces against the (unlikely, but real) case of a link
      // leaking somewhere Google could find it.
      disallow: ["/dashboard", "/admin", "/account", "/auth", "/present", "/sign", "/reset-password", "/invite"],
    },
    sitemap: "https://dubaipropertymap.ae/sitemap.xml",
  };
}
