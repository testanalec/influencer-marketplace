import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchYouTubeInfluencers } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

const ALL_NICHE_QUERIES = [
  // Fashion
  { niche: "Fashion", query: "fashion influencer India" },
  { niche: "Fashion", query: "Indian fashion blogger YouTube" },
  { niche: "Fashion", query: "saree fashion YouTube" },
  { niche: "Fashion", query: "streetwear India YouTube" },
  { niche: "Fashion", query: "sustainable fashion India" },
  { niche: "Fashion", query: "ethnic wear India YouTube" },
  { niche: "Fashion", query: "kurta fashion India YouTube" },
  { niche: "Fashion", query: "Delhi fashion vlogger" },
  { niche: "Fashion", query: "Mumbai fashion influencer YouTube" },
  { niche: "Fashion", query: "men fashion India YouTube" },
  // Beauty
  { niche: "Beauty", query: "Indian beauty YouTuber makeup" },
  { niche: "Beauty", query: "skincare routine India YouTube" },
  { niche: "Beauty", query: "Hindi beauty tips YouTube" },
  { niche: "Beauty", query: "drugstore makeup India YouTube" },
  { niche: "Beauty", query: "bridal makeup tutorial India" },
  { niche: "Beauty", query: "ayurvedic skincare India YouTube" },
  { niche: "Beauty", query: "natural beauty tips Hindi" },
  { niche: "Beauty", query: "hair care India YouTube" },
  { niche: "Beauty", query: "mehndi design India YouTube" },
  { niche: "Beauty", query: "nail art India YouTube" },
  // Tech
  { niche: "Tech", query: "tech YouTuber India Hindi" },
  { niche: "Tech", query: "smartphone review India YouTube" },
  { niche: "Tech", query: "budget phone review India" },
  { niche: "Tech", query: "laptop review India YouTube" },
  { niche: "Tech", query: "gadget unboxing India YouTube" },
  { niche: "Tech", query: "tech news India Hindi YouTube" },
  { niche: "Tech", query: "electric vehicle India YouTube" },
  { niche: "Tech", query: "software tutorial Hindi YouTube" },
  { niche: "Tech", query: "coding India YouTube Hindi" },
  { niche: "Tech", query: "5G review India YouTube" },
  // Gaming
  { niche: "Gaming", query: "BGMI gaming YouTube India" },
  { niche: "Gaming", query: "Free Fire India gaming YouTube" },
  { niche: "Gaming", query: "GTA gaming India YouTube Hindi" },
  { niche: "Gaming", query: "esports India YouTube" },
  { niche: "Gaming", query: "Minecraft India YouTube" },
  { niche: "Gaming", query: "Valorant India YouTube gaming" },
  { niche: "Gaming", query: "mobile gaming India YouTube" },
  { niche: "Gaming", query: "gaming setup India YouTube" },
  { niche: "Gaming", query: "Call of Duty India YouTube" },
  { niche: "Gaming", query: "Roblox India YouTube gaming" },
  // Fitness
  { niche: "Fitness", query: "fitness YouTube India Hindi workout" },
  { niche: "Fitness", query: "yoga India YouTube" },
  { niche: "Fitness", query: "gym workout India YouTube" },
  { niche: "Fitness", query: "weight loss India YouTube" },
  { niche: "Fitness", query: "calisthenics India YouTube" },
  { niche: "Fitness", query: "home workout India YouTube Hindi" },
  { niche: "Fitness", query: "bodybuilding India YouTube" },
  { niche: "Fitness", query: "running India YouTube" },
  { niche: "Fitness", query: "diet plan India YouTube Hindi" },
  { niche: "Fitness", query: "zumba India YouTube" },
  // Food
  { niche: "Food", query: "Indian cooking YouTube channel" },
  { niche: "Food", query: "street food India YouTube vlog" },
  { niche: "Food", query: "vegetarian recipes India YouTube" },
  { niche: "Food", query: "food vlog India Hindi YouTube" },
  { niche: "Food", query: "baking India YouTube" },
  { niche: "Food", query: "biryani recipe YouTube India" },
  { niche: "Food", query: "Mumbai street food YouTube" },
  { niche: "Food", query: "South Indian food YouTube" },
  { niche: "Food", query: "healthy recipes India YouTube" },
  { niche: "Food", query: "restaurant review India YouTube" },
  // Travel
  { niche: "Travel", query: "India travel vlog YouTube" },
  { niche: "Travel", query: "budget travel India YouTube" },
  { niche: "Travel", query: "solo travel India YouTube" },
  { niche: "Travel", query: "Rajasthan travel YouTube" },
  { niche: "Travel", query: "Himachal Pradesh travel YouTube" },
  { niche: "Travel", query: "Goa travel vlog YouTube" },
  { niche: "Travel", query: "Kerala travel YouTube" },
  { niche: "Travel", query: "northeast India travel YouTube" },
  { niche: "Travel", query: "adventure travel India YouTube" },
  { niche: "Travel", query: "road trip India YouTube" },
  // Lifestyle
  { niche: "Lifestyle", query: "lifestyle vlogger India YouTube" },
  { niche: "Lifestyle", query: "day in life India YouTube vlog" },
  { niche: "Lifestyle", query: "college life India YouTube" },
  { niche: "Lifestyle", query: "productivity India YouTube" },
  { niche: "Lifestyle", query: "minimalism India YouTube" },
  { niche: "Lifestyle", query: "morning routine India YouTube" },
  { niche: "Lifestyle", query: "study with me India YouTube" },
  { niche: "Lifestyle", query: "apartment tour India YouTube" },
  { niche: "Lifestyle", query: "personal finance India YouTube" },
  { niche: "Lifestyle", query: "motivation Hindi YouTube" },
  // Business
  { niche: "Business", query: "business India YouTube Hindi" },
  { niche: "Business", query: "startup India YouTube" },
  { niche: "Business", query: "entrepreneurship India YouTube" },
  { niche: "Business", query: "stock market India YouTube Hindi" },
  { niche: "Business", query: "passive income India YouTube" },
  // Education
  { niche: "Education", query: "education YouTube India Hindi" },
  { niche: "Education", query: "UPSC preparation YouTube India" },
  { niche: "Education", query: "JEE preparation YouTube India" },
  { niche: "Education", query: "English speaking India YouTube" },
  { niche: "Education", query: "science experiments India YouTube" },
];

function estimateRate(subscribers: number): number {
  if (subscribers >= 10000000) return 500000;
  if (subscribers >= 5000000) return 300000;
  if (subscribers >= 1000000) return 150000;
  if (subscribers >= 500000) return 75000;
  if (subscribers >= 100000) return 30000;
  if (subscribers >= 50000) return 15000;
  if (subscribers >= 10000) return 5000;
  return 1000;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = {
      niche: body.niche || null,
      minFollowers: body.minFollowers ? parseInt(body.minFollowers) : null,
      maxRate: body.maxRate ? parseInt(body.maxRate) : null,
    };

    const MAX_PAGES = 3;
    let totalSynced = 0;
    let totalUpdated = 0;
    const errors: string[] = [];
    const seenChannelIds = new Set<string>();

    const queriesToRun = filters.niche && filters.niche !== "All"
      ? ALL_NICHE_QUERIES.filter(q => q.niche === filters.niche)
      : ALL_NICHE_QUERIES;

    for (const { niche, query } of queriesToRun) {
      let pageToken: string | undefined = undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        try {
          const { channels, nextPageToken } = await searchYouTubeInfluencers(query, 50, pageToken);

          for (const channel of channels) {
            if (seenChannelIds.has(channel.id)) continue;
            seenChannelIds.add(channel.id);

            if (filters.minFollowers && channel.subscriberCount < filters.minFollowers) continue;

            const estimatedRate = estimateRate(channel.subscriberCount);
            if (filters.maxRate && estimatedRate > filters.maxRate) continue;

            const email = `yt_${channel.id}@youtube-sync.internal`;

            try {
              const existingUser = await prisma.user.findUnique({ where: { email } });

              if (existingUser) {
                await prisma.influencerProfile.update({
                  where: { userId: existingUser.id },
                  data: {
                    youtubeSubscribers: channel.subscriberCount,
                    youtubeHandle: channel.customUrl || channel.name,
                    avatar: channel.thumbnail,
                    niche,
                  },
                });
                totalUpdated++;
              } else {
                const user = await prisma.user.create({
                  data: {
                    email,
                    name: channel.name,
                    password: "youtube-sync-placeholder",
                    role: "INFLUENCER",
                  },
                });

                await prisma.influencerProfile.create({
                  data: {
                    userId: user.id,
                    youtubeSubscribers: channel.subscriberCount,
                    youtubeHandle: channel.customUrl || channel.name,
                    avatar: channel.thumbnail,
                    bio: channel.description?.slice(0, 500) || channel.name,
                    niche,
                    ratePerPost: estimatedRate,
                    location: channel.country || "IN",
                  },
                });
                totalSynced++;
              }
            } catch (dbErr: any) {
              errors.push(`DB error for ${channel.name}: ${dbErr.message}`);
            }
          }

          if (!nextPageToken) break;
          pageToken = nextPageToken;
        } catch (apiErr: any) {
          errors.push(`API error for query "${query}": ${apiErr.message}`);
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced} new + ${totalUpdated} updated YouTube influencers`,
      totalSynced,
      totalUpdated,
      filters,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
