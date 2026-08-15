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
      //
      // /broker, /broker-agency, /salesperson, /staff are the remaining
      // auth-gated portals (same class as /dashboard/admin/account) --
      // previously missing here, so Google could spend crawl budget on
      // pages that only ever render a login redirect for a logged-out
      // crawler. /embed is the Developer Embeddable Map Widget -- built
      // to be iframed on a developer's own third-party site, not browsed
      // directly here, so it has no standalone search value (this
      // doesn't block the embedding itself, only Google indexing it as
      // its own page). /s/[code] is a pure redirect (staff shared links),
      // never a page with content of its own. /api is routes, not pages.
      // /admin already prefix-covers /admin-ip-blocked, no separate entry
      // needed.
      //
      // Robots.txt disallow is a plain string-prefix match, not a path-
      // segment match -- "/broker" would also match the entirely public
      // "/brokers" directory and "/brokers/[slug]" profiles (patch_127),
      // and a bare "/s" would match "/sitemap.xml" itself (declared two
      // lines below!) along with "/sign"/"/salesperson"/"/staff". Both
      // use "$"/trailing-slash anchoring instead to disallow exactly the
      // intended tree and nothing adjacent.
      //
      // /favorites and /login, /register, /forgot-password -- all
      // personalized (favorites) or auth-form (the rest) pages with no
      // unique content for a guest crawler, previously missing here.
      // /account was already covered.
      disallow: [
        "/dashboard",
        "/admin",
        "/account",
        "/auth",
        "/favorites",
        "/login",
        "/register",
        "/forgot-password",
        "/present",
        "/sign",
        "/reset-password",
        "/invite",
        "/broker$",
        "/broker/",
        "/broker-agency",
        "/broker-device-conflict",
        "/salesperson",
        "/staff",
        "/embed",
        "/s/",
        "/api",
      ],
    },
    sitemap: "https://dubaipropertymap.ae/sitemap.xml",
  };
}
