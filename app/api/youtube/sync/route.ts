import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchYouTubeInfluencers } from "@/lib/youtube";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Niche keyword mapping for YouTube search
const NICHE_QUERIES: { niche: string; query: string }[] = [
  { niche: "Fashion", query: "fashion influencer India" },
  { niche: "Beauty", query: "beauty influencer India" },
  { niche: "Tech", query: "tech YouTuber India" },
  { niche: "Gaming", query: "gaming YouTuber India" },
  { niche: "Fitness", query: "fitness influencer India" },
  { niche: "Food", query: "food vlogger India" },
  { niche: "Travel", query: "travel vlogger India" },
];

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY is not configured. Please add it to your environment variables." },
        { status: 500 }
      );
    }

    let totalSynced = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const { niche, query } of NICHE_QUERIES) {
      try {
        const result = await searchYouTubeInfluencers(query, 10);

        for (const channel of result.channels) {
          // Skip channels with very few subscribers (less than 1000)
          if (channel.subscriberCount < 1000) {
            totalSkipped++;
            continue;
          }

          // Use YouTube channel ID as a unique email to avoid duplicates
          const syntheticEmail = `yt_${channel.channelId}@youtube-sync.internal`;

          // Check if this YouTube channel already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: syntheticEmail },
            include: { influencerProfile: true },
          });

          if (existingUser?.influencerProfile) {
            // Update existing profile with fresh data
            await prisma.influencerProfile.update({
              where: { userId: existingUser.id },
              data: {
                name: channel.name,
                bio: channel.description.slice(0, 500) || `YouTube creator in ${niche}`,
                avatar: channel.thumbnailUrl,
                youtubeFollowers: channel.subscriberCount,
                youtube: channel.customUrl
                  ? `https://youtube.com/${channel.customUrl}`
                  : `https://youtube.com/channel/${channel.channelId}`,
                location: channel.country || null,
                updatedAt: new Date(),
              },
            });
            totalSynced++;
          } else {
            // Create new user + influencer profile for this YouTube channel
            await prisma.user.create({
              data: {
                email: syntheticEmail,
                password: "youtube-sync-no-login",
                role: "INFLUENCER",
                influencerProfile: {
                  create: {
                    name: channel.name,
                    bio: channel.description.slice(0, 500) || `YouTube creator in ${niche}`,
                    avatar: channel.thumbnailUrl,
                    niche: niche,
                    youtube: channel.customUrl
                      ? `https://youtube.com/${channel.customUrl}`
                      : `https://youtube.com/channel/${channel.channelId}`,
                    youtubeFollowers: channel.subscriberCount,
                    location: channel.country || null,
                    ratePerPost: estimateRatePerPost(channel.subscriberCount),
                    currency: "INR",
                  },
                },
              },
            });
            totalSynced++;
          }
        }
      } catch (err: any) {
        errors.push(`${niche}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalSynced,
      totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${totalSynced} YouTube influencers across ${NICHE_QUERIES.length} niches.`,
    });
  } catch (err: any) {
    console.error("YouTube sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync YouTube influencers" },
      { status: 500 }
    );
  }
}

// Estimate a reasonable rate per post based on subscriber count
function estimateRatePerPost(subscribers: number): number {
  if (subscribers >= 1_000_000) return 100000;  // 1M+ -> ₹1,00,000
  if (subscribers >= 500_000) return 50000;      // 500K+ -> ₹50,000
  if (subscribers >= 100_000) return 20000;      // 100K+ -> ₹20,000
  if (subscribers >= 50_000) return 10000;       // 50K+ -> ₹10,000
  if (subscribers >= 10_000) return 5000;        // 10K+ -> ₹5,000
  return 2000;                                    // <10K -> ₹2,000
}
