import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL ?? "https://hardcap.onrender.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      disallow: ["/dashboard", "/expenses", "/groups", "/lending", "/insight", "/api", "/goals"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}