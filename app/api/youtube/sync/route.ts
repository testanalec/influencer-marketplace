import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Known Indian YouTube channel IDs - costs only 1 unit per channel to fetch (vs 100 for search)
// Organized by niche for easy filtering
const KNOWN_CHANNELS: { id: string; niche: string }[] = [
  // Fashion
  { id: "UCbTgjOSEMIjrHHAyDKRB8rg", niche: "Fashion" },
  { id: "UCpI1SBdBwdFhQysMKFgRFrA", niche: "Fashion" },
  { id: "UCfKPHpbL34XSZ7lLzKkbZpg", niche: "Fashion" },
  { id: "UCGE4oBpjTNGXJDaUjskmArA", niche: "Fashion" },
  { id: "UCddiUEpeqJcYeBxX1IVBKvQ", niche: "Fashion" },
  { id: "UC9-y-6csu5WGm29I7JiwpnA", niche: "Fashion" },
  { id: "UCOmHUn--16B90oW2L6FRR3A", niche: "Fashion" },
  { id: "UC3yBdPFGbOtf4K9xzM6WTMA", niche: "Fashion" },
  // Beauty
  { id: "UCXRQGDGgHXVBx9bn4OqpZsw", niche: "Beauty" },
  { id: "UCqECaJ8Gagnn7ztGwHJAInA", niche: "Beauty" },
  { id: "UCIa9HMdFsBfbHEKXFMiQq5Q", niche: "Beauty" },
  { id: "UCjR-NzwYIl6qmCQ2I3Fv5Ow", niche: "Beauty" },
  { id: "UCHkYrJ2Fbe7pxMNT4WRYNOQ", niche: "Beauty" },
  { id: "UCr-TSqFCMu8oD1YWBFY-09A", niche: "Beauty" },
  { id: "UC0zDNj8MlP6-X-4b9EfCHOA", niche: "Beauty" },
  { id: "UCBcRF18a7Qf58cCRy5xuWwQ", niche: "Beauty" },
  // Tech
  { id: "UCkaG_c2FNH-oFsEZBiZ40eA", niche: "Tech" }, // Technical Guruji
  { id: "UCVpankR4-WKRQ8K3HMHSYTA", niche: "Tech" }, // Trakin Tech
  { id: "UC94OGasH3nrKBH0nRHbWGIg", niche: "Tech" }, // Beebom
  { id: "UCz-JCsXF8oEMEXQ5f8HwKRw", niche: "Tech" },
  { id: "UCvQECJukTDE2i6aCoMnS-Vg", niche: "Tech" },
  { id: "UCDGiCfCZAMBHyKTEQnAQCMA", niche: "Tech" },
  { id: "UCQhB-FJXFLGV7DMWqwBQtOw", niche: "Tech" },
  { id: "UCgSN9P2UX1gXoJm_ZxNP5wg", niche: "Tech" },
  // Gaming
  { id: "UCGzCvZD8I6_C9S3m-bRHs3w", niche: "Gaming" }, // Total Gaming
  { id: "UCFqJpzHDDDJkPJrFflUWqtg", niche: "Gaming" }, // Mortal
  { id: "UCpJoVMIVGH3RnON-DgEQ5dg", niche: "Gaming" },
  { id: "UCvaTdHTWBGv3MKj3KVqJVCw", niche: "Gaming" },
  { id: "UCzDCpFM69hqJHnULlh7VRmg", niche: "Gaming" },
  { id: "UC0C-w0YjGpqDXGB8IHb662A", niche: "Gaming" },
  { id: "UCblpTjMVL9y4w0_XlCg4rbg", niche: "Gaming" },
  { id: "UCFtCUNQnb5_gqkSCLcqoerA", niche: "Gaming" },
  // Fitness
  { id: "UCE3z4ToBzXEVAOLMQoiOeJg", niche: "Fitness" }, // Fit Tuber
  { id: "UCIJBHdlUdRpZsMYBqYWWgrw", niche: "Fitness" },
  { id: "UCRNpGnMGk9AEbWfYMHMNDng", niche: "Fitness" },
  { id: "UCp3JUfKRRhA74CUGXnRBROA", niche: "Fitness" },
  { id: "UC_GGsTTuuCHQvjxBjNGKmfg", niche: "Fitness" },
  { id: "UCqO5SWVn8vXBQ6KKMOODdww", niche: "Fitness" },
  { id: "UCnUYZLuoy1rq1aVMwx4aTzw", niche: "Fitness" },
  { id: "UC6nSFpj9HTCZ5t-N3Rm3-HA", niche: "Fitness" },
  // Food
  { id: "UCpVVRlz4S3VaGTnGTxLVSoA", niche: "Food" }, // Kunal Kapur
  { id: "UCm9_CUGR00LaBFiNiNi2vFA", niche: "Food" },
  { id: "UCSA_QEKOA_iXxNvkBBJfhVg", niche: "Food" },
  { id: "UCDFxMOIJMEtk8zqVBFPYbgQ", niche: "Food" },
  { id: "UCFzBT3PZfO7jMSJr6kZbFkA", niche: "Food" },
  { id: "UCiZyZT5a6_v7RYwx6vhDNEw", niche: "Food" },
  { id: "UC4QNMnfSbXSp4RyUMeBRCDA", niche: "Food" },
  { id: "UCzzfHNzKkFqnf_ykQxHXR8A", niche: "Food" },
  // Travel
  { id: "UCknLrEdhRCp1aegoMqRaCZg", niche: "Travel" }, // Mumbiker Nikhil
  { id: "UC41HLcLHjV_o5UDaMKhimSQ", niche: "Travel" },
  { id: "UCzwxFR_dpZRlvM1bVNqXfOQ", niche: "Travel" },
  { id: "UCWBz6FEYAAnxmWTWHyf_Xog", niche: "Travel" },
  { id: "UCsT0YIqwnpJCM-mx7-gSA4Q", niche: "Travel" },
  { id: "UCx0sM8L6HBFX7M_yPAcL6aw", niche: "Travel" },
  { id: "UCYxkqANvFPAvBMDGTHFLe4Q", niche: "Travel" },
  { id: "UCTmQF61G8sKiGMEPNGSfKqA", niche: "Travel" },
  // Lifestyle
  { id: "UCqiGhHPBJvQOdkJCvXqHYgA", niche: "Lifestyle" }, // Prajakta Koli
  { id: "UCxJka_qNSADiNAEd23s85Mg", niche: "Lifestyle" },
  { id: "UC0LVQKDQ7GHbAD16XL9kAVg", niche: "Lifestyle" },
  { id: "UCJH5Vg5bqpIhFhBWFPHxLbw", niche: "Lifestyle" },
  { id: "UCFtjCEpqJzVCbcwRLKQSVXA", niche: "Lifestyle" },
  { id: "UC2Z2mczXWpemJf_ILbGSxqw", niche: "Lifestyle" },
  { id: "UCnPXGJm7pYvvpC84dF5YQIA", niche: "Lifestyle" },
  { id: "UCkAGrHCLFmlK3H2kd6isipg", niche: "Lifestyle" },
  // Business / Finance
  { id: "UCBwmqGULJBsQPsEtBbBQQkg", niche: "Business" }, // CA Rachana Ranade
  { id: "UCgXF3hUfHGFJYGgfuLDXCEg", niche: "Business" }, // Pranjal Kamra
  { id: "UC3-qMJLfbOFXLUwp93RYVAQ", niche: "Business" },
  { id: "UCJWOoAVTBW_mBKiH1Q8c8dA", niche: "Business" },
  { id: "UCiDKcjKocimAO1tVw1XIJ0Q", niche: "Business" },
  { id: "UC3QsLBdFEKGSFQ_0XHKC8Ig", niche: "Business" },
  { id: "UCdXnFHtHSU_ZoJVDJI5bqew", niche: "Business" },
  { id: "UC6A7TtMDPAP3_RHGSZoZ79g", niche: "Business" },
  // Education
  { id: "UCiNKM0ZMncSO4Pk6cDfMGmQ", niche: "Education" }, // Vedantu
  { id: "UC0RhatS1pyxInC00YKjjBqQ", niche: "Education" }, // Kurzgesagt India
  { id: "UCW2o9FqIh9ErJ0B-8bPimKA", niche: "Education" },
  { id: "UCaXkIU1QidjPwiAYu6GcHjg", niche: "Education" },
  { id: "UCsT0YIqwnpJCM-mx7-gSA4Q", niche: "Education" },
  { id: "UCq-Fj5jknLsUf-MWSy4_brA", niche: "Education" }, // TED
  { id: "UCVHFbw7woebKtfvug_tURqw", niche: "Education" },
  { id: "UC4a-Gbdw7vOaccHmFo40b9g", niche: "Education" }, // Khan Academy
];

const ALL_NICHE_QUERIES = [
  { niche: "Fashion", query: "fashion influencer India YouTube" },
  { niche: "Fashion", query: "Indian fashion blogger YouTube" },
  { niche: "Fashion", query: "saree fashion YouTube channel" },
  { niche: "Fashion", query: "streetwear India YouTube" },
  { niche: "Fashion", query: "ethnic wear India YouTube" },
  { niche: "Beauty", query: "Indian beauty YouTuber makeup" },
  { niche: "Beauty", query: "skincare routine India YouTube" },
  { niche: "Beauty", query: "bridal makeup tutorial India" },
  { niche: "Beauty", query: "hair care India YouTube" },
  { niche: "Beauty", query: "nail art India YouTube" },
  { niche: "Tech", query: "tech YouTuber India Hindi" },
  { niche: "Tech", query: "smartphone review India YouTube" },
  { niche: "Tech", query: "gadget unboxing India YouTube" },
  { niche: "Tech", query: "laptop review India YouTube" },
  { niche: "Tech", query: "coding India YouTube Hindi" },
  { niche: "Gaming", query: "BGMI gaming YouTube India" },
  { niche: "Gaming", query: "Free Fire India gaming YouTube" },
  { niche: "Gaming", query: "Valorant India YouTube gaming" },
  { niche: "Gaming", query: "esports India YouTube" },
  { niche: "Gaming", query: "mobile gaming India YouTube" },
  { niche: "Fitness", query: "fitness YouTube India Hindi" },
  { niche: "Fitness", query: "yoga India YouTube channel" },
  { niche: "Fitness", query: "gym workout India YouTube" },
  { niche: "Fitness", query: "weight loss India YouTube" },
  { niche: "Fitness", query: "home workout India YouTube Hindi" },
  { niche: "Food", query: "Indian cooking YouTube channel" },
  { niche: "Food", query: "street food India YouTube vlog" },
  { niche: "Food", query: "vegetarian recipes India YouTube" },
  { niche: "Food", query: "South Indian food YouTube" },
  { niche: "Food", query: "restaurant review India YouTube" },
  { niche: "Travel", query: "India travel vlog YouTube" },
  { niche: "Travel", query: "budget travel India YouTube" },
  { niche: "Travel", query: "Goa travel vlog YouTube" },
  { niche: "Travel", query: "Kerala travel YouTube" },
  { niche: "Travel", query: "road trip India YouTube" },
  { niche: "Lifestyle", query: "lifestyle vlogger India YouTube" },
  { niche: "Lifestyle", query: "day in life India YouTube vlog" },
  { niche: "Lifestyle", query: "morning routine India YouTube" },
  { niche: "Lifestyle", query: "personal finance India YouTube" },
  { niche: "Lifestyle", query: "motivation Hindi YouTube" },
  { niche: "Business", query: "business India YouTube Hindi" },
  { niche: "Business", query: "startup India YouTube" },
  { niche: "Business", query: "stock market India YouTube Hindi" },
  { niche: "Business", query: "passive income India YouTube" },
  { niche: "Business", query: "entrepreneurship India YouTube" },
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

async function fetchChannelsByIds(ids: string[], apiKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Channel fetch failed: " + res.status);
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    name: item.snippet?.title || "",
    description: item.snippet?.description || "",
    customUrl: item.snippet?.customUrl || "",
    thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
    subscriberCount: parseInt(item.statistics?.subscriberCount || "0"),
    country: item.snippet?.country || "IN",
  }));
}

async function upsertChannel(channel: any, niche: string, totalSynced: { v: number }, totalUpdated: { v: number }, errors: string[]) {
  if (!channel.id) return;
  const email = `yt_${channel.id}@youtube-sync.internal`;
  const estimatedRate = estimateRate(channel.subscriberCount);
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.influencerProfile.update({
        where: { userId: existingUser.id },
        data: {
          youtubeFollowers: channel.subscriberCount,
          youtube: channel.customUrl || channel.name,
          avatar: channel.thumbnail,
        },
      });
      totalUpdated.v++;
    } else {
      const user = await prisma.user.create({
        data: { email, password: "youtube-sync-placeholder", role: "INFLUENCER" },
      });
      await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          name: channel.name,
          youtubeFollowers: channel.subscriberCount,
          youtube: channel.customUrl || channel.name,
          avatar: channel.thumbnail,
          bio: channel.description?.slice(0, 500) || channel.name,
          niche,
          ratePerPost: estimatedRate,
          location: channel.country || "IN",
        },
      });
      totalSynced.v++;
    }
  } catch (err: any) {
    errors.push(`DB ${channel.name}: ${err.message?.slice(0, 80)}`);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });

    const body = await request.json().catch(() => ({}));
    const filters = {
      niche: body.niche || null,
      minFollowers: body.minFollowers ? parseInt(body.minFollowers) : null,
      maxRate: body.maxRate ? parseInt(body.maxRate) : null,
    };

    const totalSynced = { v: 0 };
    const totalUpdated = { v: 0 };
    const errors: string[] = [];
    const seenIds = new Set<string>();

    // Step 1: Fetch known channels by ID (1 unit per 50 channels - very efficient)
    const knownToRun = filters.niche && filters.niche !== "All"
      ? KNOWN_CHANNELS.filter(c => c.niche === filters.niche)
      : KNOWN_CHANNELS;

    const batchSize = 50;
    for (let i = 0; i < knownToRun.length; i += batchSize) {
      const batch = knownToRun.slice(i, i + batchSize);
      const nicheMap = Object.fromEntries(batch.map(c => [c.id, c.niche]));
      try {
        const channels = await fetchChannelsByIds(batch.map(c => c.id), apiKey);
        for (const ch of channels) {
          if (seenIds.has(ch.id)) continue;
          seenIds.add(ch.id);
          if (filters.minFollowers && ch.subscriberCount < filters.minFollowers) continue;
          if (filters.maxRate && estimateRate(ch.subscriberCount) > filters.maxRate) continue;
          await upsertChannel(ch, nicheMap[ch.id] || "Lifestyle", totalSynced, totalUpdated, errors);
        }
      } catch (e: any) {
        errors.push(`Batch fetch error: ${e.message?.slice(0, 80)}`);
      }
    }

    // Step 2: Search-based sync (uses more quota but finds new channels)
    const queriesToRun = filters.niche && filters.niche !== "All"
      ? ALL_NICHE_QUERIES.filter(q => q.niche === filters.niche)
      : ALL_NICHE_QUERIES;

    const MAX_PAGES = 2;
    for (const { niche, query } of queriesToRun) {
      let pageToken: string | undefined = undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        try {
          const params = new URLSearchParams({
            part: "snippet", type: "channel", q: query, maxResults: "50", key: apiKey,
            ...(pageToken ? { pageToken } : {}),
          });
          const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
          if (!searchRes.ok) {
            const err = await searchRes.json();
            errors.push(`Search "${query}": ${err.error?.message?.slice(0, 80) || searchRes.status}`);
            break;
          }
          const searchData = await searchRes.json();
          const channelIds = (searchData.items || []).map((i: any) => i.snippet?.channelId || i.id?.channelId).filter(Boolean);
          if (channelIds.length === 0) break;

          const channels = await fetchChannelsByIds(channelIds, apiKey);
          for (const ch of channels) {
            if (seenIds.has(ch.id)) continue;
            seenIds.add(ch.id);
            if (filters.minFollowers && ch.subscriberCount < filters.minFollowers) continue;
            if (filters.maxRate && estimateRate(ch.subscriberCount) > filters.maxRate) continue;
            await upsertChannel(ch, niche, totalSynced, totalUpdated, errors);
          }

          pageToken = searchData.nextPageToken;
          if (!pageToken) break;
        } catch (e: any) {
          errors.push(`Query "${query}": ${e.message?.slice(0, 80)}`);
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced.v} new + ${totalUpdated.v} updated YouTube influencers`,
      totalSynced: totalSynced.v,
      totalUpdated: totalUpdated.v,
      filters,
      errors: errors.slice(0, 15),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
