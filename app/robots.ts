import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
