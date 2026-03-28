export interface YouTubeChannel {
  channelId: string;
  name: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  country?: string;
  thumbnailUrl?: string;
  customUrl?: string;
}

export interface YouTubeSearchResult {
  channels: YouTubeChannel[];
  nextPageToken?: string;
}

export async function searchYouTubeInfluencers(
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  // Step 1: Search for channels by keyword/niche
  const searchParams = new URLSearchParams({
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: maxResults.toString(),
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`
  );

  if (!searchRes.ok) {
    const err = await searchRes.json();
    throw new Error(err?.error?.message || "YouTube search failed");
  }

  const searchData = await searchRes.json();
  const channelIds: string[] = searchData.items
    .map((item: any) => item?.id?.channelId)
    .filter(Boolean);

  if (channelIds.length === 0) {
    return { channels: [] };
  }

  // Step 2: Fetch detailed channel stats + snippet
  const statsParams = new URLSearchParams({
    part: "snippet,statistics",
    id: channelIds.join(","),
    key: apiKey,
  });

  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${statsParams}`
  );

  if (!statsRes.ok) {
    const err = await statsRes.json();
    throw new Error(err?.error?.message || "YouTube channel fetch failed");
  }

  const statsData = await statsRes.json();

  const channels: YouTubeChannel[] = statsData.items.map((item: any) => ({
    channelId: item.id,
    name: item.snippet?.title || "",
    description: item.snippet?.description || "",
    subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
    videoCount: parseInt(item.statistics?.videoCount || "0", 10),
    viewCount: parseInt(item.statistics?.viewCount || "0", 10),
    country: item.snippet?.country,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.default?.url,
    customUrl: item.snippet?.customUrl,
  }));

  return {
    channels,
    nextPageToken: searchData.nextPageToken,
  };
}

export function formatSubscriberCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)}K`;
  }
  return count.toString();
}
