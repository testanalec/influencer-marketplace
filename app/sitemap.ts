import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://influmarket.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/influencers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic influencer profile pages
  try {
    const influencers = await prisma.influencerProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
    });

    const profilePages: MetadataRoute.Sitemap = influencers.map((inf) => ({
      url: `${SITE_URL}/influencers/${inf.id}`,
      lastModified: inf.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...profilePages];
  } catch {
    return staticPages;
  }
}
