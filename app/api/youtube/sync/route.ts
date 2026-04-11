import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchYouTubeInfluencers } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

const NICHE_QUERIES = [
  { niche: "Fashion", query: "fashion influencer India" },
  { niche: "Beauty", query: "beauty influencer India" },
  { niche: "Tech", query: "tech YouTuber India" },
  { niche: "Gaming", query: "gaming YouTuber India" },
  { niche: "Fitness", query: "fitness influencer India" },
  { niche: "Food", query: "food vlogger India" },
  { niche: "Travel", query: "travel vlogger India" },
  { niche: "Fashion", query: "fashion blogger YouTube" },
  { niche: "Beauty", query: "makeup tutorial YouTube India" },
  { niche: "Tech", query: "technology review YouTube India" },
  { niche: "Gaming", query: "mobile gaming YouTube India" },
  { niche: "Fitness", query: "workout yoga YouTube India" },
  { niche: "Food", query: "cooking recipe YouTube India" },
  { niche: "Travel", query: "travel vlog India YouTube" },
  ];

function estimateRatePerPost(subscriberCount: number): number {
    if (subscriberCount >= 10000000) return 500000;Expa
    if (subscriberCount >= 1000000) return 100000;
    if (subscriberCount >= 500000) return 50000;
    if (subscriberCount >= 100000) return 20000;
    if (subscriberCount >= 50000) return 10000;
    if (subscriberCount >= 10000) return 5000;
    if (subscriberCount >= 1000) return 2000;
    return 1000;
}

  export async function POST(request: Request) {
      try {
            const session = await getServerSession(authOptions);
            if (!session || session.user.role !== "COMPANY") {
                    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

        if (!process.env.YOUTUBE_API_KEY) {
                return NextResponse.json(
                  { error: "YouTube API key not configured" },
                  { status: 500 }
                        );
        }

        let totalSynced = 0;
            const errors: string[] = [];

        for (const { niche, query } of NICHE_QUERIES) {
                try {
                          let pageToken: string | undefined = undefined;
                          const MAX_PAGES = 4; // 50 results × 4 pages = 200 per query

                  for (let page = 0; page < MAX_PAGES; page++) {
                              const result = await searchYouTubeInfluencers(query, 50, pageToken);

                            for (const channel of result.channels) {
                                          try {
                                                          const syntheticEmail = `yt_${channel.channelId}@youtube-sync.internal`;

                                            const user = await prisma.user.upsert({
                                                              where: { email: syntheticEmail },
                                                              update: {},
                                                              create: {
                                                                                  email: syntheticEmail,
                                                                                  name: channel.name,
                                                                                  role: "INFLUENCER",
                                                                                  password: `yt_${channel.channelId}`,
                                                              },
                                            });

                                            await prisma.influencerProfile.upsert({
                                                              where: { userId: user.id },
                                                              update: {
                                                                                  name: channel.name,
                                                                                  bio: channel.description?.slice(0, 500) || "",
                                                                                  niche: niche,
                                                                                  youtube: channel.customUrl || `https://youtube.com/channel/${channel.channelId}`,
                                                                                  youtubeFollowers: channel.subscriberCount,
                                                                                  location: channel.country || "IN",
                                                                                  avatar: channel.thumbnailUrl || "",
                                                                                  ratePerPost: estimateRatePerPost(channel.subscriberCount),
                                                              },
                                                              create: {
                                                                                  userId: user.id,
                                                                                  name: channel.name,
                                                                                  bio: channel.description?.slice(0, 500) || "",
                                                                                  niche: niche,
                                                                                  youtube: channel.customUrl || `https://youtube.com/channel/${channel.channelId}`,
                                                                                  youtubeFollowers: channel.subscriberCount,
                                                                                  location: channel.country || "IN",
                                                                                  avatar: channel.thumbnailUrl || "",
                                                                                  ratePerPost: estimateRatePerPost(channel.subscriberCount),
                                                              },
                                            });

                                            totalSynced++;
                                          } catch (channelError) {
                                                          // Skip duplicate channels silently
                                          }
                            }

                            if (!result.nextPageToken) break;
                              pageToken = result.nextPageToken;
                  }
                } catch (nicheError) {
                          errors.push(`Error syncing ${niche}: ${nicheError}`);
                }
        }

        return NextResponse.json({
                success: true,
                message: `Successfully synced ${totalSynced} YouTube influencers`,
                totalSynced,
                errors: errors.length > 0 ? errors : undefined,
        });
      } catch (error) {
            console.error("YouTube sync error:", error);
            return NextResponse.json(
              { error: "Failed to sync YouTube influencers" },
              { status: 500 }
                  );
      }
  }
