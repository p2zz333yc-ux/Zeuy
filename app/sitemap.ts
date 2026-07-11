import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.domain}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/cgv", "/confidentialite", "/retours", "/mentions-legales"];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "yearly",
    priority: route === "" ? 1 : 0.3,
  }));
}
