import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Site-wide default share-card image -- shown whenever a page doesn't
// supply its own (project/blog/community/developer pages already do, via
// their own generateMetadata `openGraph.images`; this covers everything
// else: homepage, /about, /faq, /communities, /developers, /calculators,
// /compare, etc.). Before this, those pages shared with literally no
// image at all, which measurably hurts click-through on social/WhatsApp
// link previews -- a real, if small, ranking-adjacent signal, and just
// looks unfinished when someone shares a link to try to get a backlink.
export const alt = "Dubai Property Map — Find Off-Plan & Ready Properties";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/logo/dubai-property-map-logo.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #05080f 0%, #0b1220 55%, #101a2e 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #f2c665, #d89b2b)",
          }}
        />
        <img src={logoSrc} width={520} height={140} alt="" style={{ objectFit: "contain" }} />
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#c9d3e0",
            letterSpacing: 1,
          }}
        >
          Off-Plan &amp; Ready Properties Across Dubai
        </div>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 14,
            fontSize: 22,
            color: "#f2c665",
          }}
        >
          <span>Interactive Map</span>
          <span style={{ color: "#3a4658" }}>•</span>
          <span>Verified Developers</span>
          <span style={{ color: "#3a4658" }}>•</span>
          <span>Real-Time Listings</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
