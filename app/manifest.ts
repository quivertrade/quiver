import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quiver — Tokenized Stock Perps",
    short_name: "Quiver",
    description:
      "Perpetual futures on tokenized stocks, on Robinhood Chain testnet.",
    start_url: "/trade",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
