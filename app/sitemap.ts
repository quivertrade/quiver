import type { MetadataRoute } from "next";

const BASE = "https://quiver-trade.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/trade", "/docs", "/roadmap", "/token", "/risk"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
