import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchYouTubeInfluencers } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

const ALL_NICHE_QUERIES = [
	// Fashion
	{ niche: "Fashion", query: "fashion influencer India 2024" },
	{ niche: "Fashion", query: "Indian fashion blogger YouTube" },
	{ niche: "Fashion", query: "saree fashion YouTube channel" },
	{ niche: "Fashion", query: "streetwear fashion India YouTube" },
	{ niche: "Fashion", query: "sustainable fashion India YouTube" },
	// Beauty
	{ niche: "Beauty", query: "Indian beauty YouTuber makeup" },
	{ niche: "Beauty", query: "skincare routine India YouTube" },
	{ niche: "Beauty", query: "Hindi beauty tips YouTube" },
	{ niche: "Beauty", query: "drugstore makeup India YouTube" },
	{ niche: "Beauty", query: "bridal makeup tutorial India" },
	// Tech
	{ niche: "Tech", query: "tech YouTuber India Hindi" },
	{ niche: "Tech", query: "smartphone review India YouTube" },
	{ niche: "Tech", query: "budget phone review India YouTube" },
	{ niche: "Tech", query: "laptop review India YouTube 2024" },
	{ niche: "Tech", query: "gadget unboxing India YouTube" },
	// Gaming
	{ niche: "Gaming", query: "BGMI gaming YouTube India" },
	{ niche: "Gaming", query: "Free Fire India gaming YouTube" },
	{ niche: "Gaming", query: "GTA gaming India YouTube Hindi" },
	{ niche: "Gaming", query: "esports India YouTube gaming" },
	{ niche: "Gaming", query: "Minecraft India YouTube gaming" },
	// Fitness
	{ niche: "Fitness", query: "fitness YouTube India Hindi workout" },
	{ niche: "Fitness", query: "yoga India YouTube channel" },
	{ niche: "Fitness", query: "gym workout India YouTube" },
	{ niche: "Fitness", query: "weight loss India YouTube" },
	{ niche: "Fitness", query: "calisthenics India YouTube fitness" },
	// Food
	{ niche: "Food", query: "Indian cooking YouTube channel" },
	{ niche: "Food", query: "street food India YouTube vlog" },
	{ niche: "Food", query: "vegetarian recipes India YouTube" },
	{ niche: "Food", query: "food vlog India Hindi YouTube" },
	{ niche: "Food", query: "baking India YouTube channel" },
	// Travel
	{ niche: "Travel", query: "India travel vlog YouTube" },
	{ niche: "Travel", query: "budget travel India YouTube" },
	{ niche: "Travel", query: "solo travel India YouTube vlog" },
	{ niche: "Travel", query: "Rajasthan travel YouTube vlog" },
	{ niche: "Travel", query: "Himachal Pradesh travel YouTube" },
	// Lifestyle
	{ niche: "Lifestyle", query: "lifestyle vlogger India YouTube" },
	{ niche: "Lifestyle", query: "day in life India YouTube vlog" },
	{ niche: "Lifestyle", query: "college life India YouTube vlog" },
	{ niche: "Lifestyle", query: "productivity India YouTube channel" },
	{ niche: "Lifestyle", query: "minimalism India YouTube lifestyle" },
];

function estimateRatePerPost(subscriberCount: number): number {
	if (subscriberCount >= 10000000) return 500000;
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
		if (!session || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
		}

		if (!process.env.YOUTUBE_API_KEY) {
			return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
		}

		// Parse optional filters from request body
		let filters: { niche?: string; minFollowers?: number; maxRate?: number } = {};
		try {
			const body = await request.json();
			filters = body || {};
		} catch {
			filters = {};
		}

		// Filter queries by niche if specified
		const queriesToRun = filters.niche
			? ALL_NICHE_QUERIES.filter(q => q.niche.toLowerCase() === filters.niche!.toLowerCase())
			: ALL_NICHE_QUERIES;

		let totalSynced = 0;
		let totalUpdated = 0;
		const errors: string[] = [];

		for (const { niche, query } of queriesToRun) {
			try {
				let pageToken: string | undefined = undefined;
				const MAX_PAGES = 2;

				for (let page = 0; page < MAX_PAGES; page++) {
					const result = await searchYouTubeInfluencers(query, 50, pageToken);

					for (const channel of result.channels) {
						try {
							// Apply minFollowers filter
							if (filters.minFollowers && channel.subscriberCount < filters.minFollowers) {
								continue;
							}

							const estimatedRate = estimateRatePerPost(channel.subscriberCount);

							// Apply maxRate filter
							if (filters.maxRate && estimatedRate > filters.maxRate) {
								continue;
							}

							const syntheticEmail = `yt_${channel.channelId}@youtube-sync.internal`;

							// Upsert user — create if new, update name/avatar if existing
							const user = await prisma.user.upsert({
								where: { email: syntheticEmail },
								create: {
									email: syntheticEmail,
									name: channel.name,
									role: "INFLUENCER",
									password: `yt_${channel.channelId}`,
								},
								update: {
									name: channel.name,
								},
							});

							// Upsert influencer profile — create if new, update YouTube stats if existing
							const profileData = {
								name: channel.name,
								bio: channel.description?.slice(0, 500) || "",
								niche: niche,
								youtube: channel.customUrl
									? `https://youtube.com/${channel.customUrl}`
									: `https://youtube.com/channel/${channel.channelId}`,
								youtubeFollowers: channel.subscriberCount,
								location: channel.country || "IN",
								avatar: channel.thumbnailUrl || "",
								ratePerPost: estimatedRate,
							};

							const existing = await prisma.influencerProfile.findUnique({
								where: { userId: user.id },
							});

							await prisma.influencerProfile.upsert({
								where: { userId: user.id },
								create: profileData,
								update: {
									name: profileData.name,
									bio: profileData.bio,
									youtube: profileData.youtube,
									youtubeFollowers: profileData.youtubeFollowers,
									avatar: profileData.avatar,
									ratePerPost: profileData.ratePerPost,
									// Preserve existing Instagram/Facebook data — don't overwrite
								},
							});

							if (existing) {
								totalUpdated++;
							} else {
								totalSynced++;
							}
						} catch (channelError) {
							// skip individual channel errors
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
			message: `Synced ${totalSynced} new + ${totalUpdated} updated YouTube influencers`,
			totalSynced,
			totalUpdated,
			filters,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("YouTube sync error:", error);
		return NextResponse.json({ error: "Failed to sync YouTube influencers" }, { status: 500 });
	}
}
