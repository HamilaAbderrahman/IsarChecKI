import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://isar-checki.ahamila.de/sitemap.xml",
    host: "https://isar-checki.ahamila.de",
  };
}
