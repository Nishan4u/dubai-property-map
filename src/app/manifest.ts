import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dubai Property Map",
    short_name: "DPM",
    description:
      "Explore Dubai's premium property market on an interactive map — off-plan launches, ready homes, developers, and communities.",
    start_url: "/",
    display: "standalone",
    background_color: "#05080f",
    theme_color: "#05080f",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
