import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/influencers", "/influencers/"],
        disallow: ["/dashboard/", "/api/", "/onboarding", "/admin/"],
      },
    ],
    sitemap: "https://influmarket.in/sitemap.xml",
  };
}
