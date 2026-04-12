/**
 * lib/social.ts
 * Helpers to fetch Instagram and Facebook follower counts.
 *
 * Instagram: uses the Instagram oEmbed API (no auth required for public accounts).
 *   Returns follower count if available in the oEmbed response, otherwise null.
 *   Note: Instagram oEmbed does NOT return follower counts — it returns only embed HTML.
 *   A real follower count requires the Instagram Graph API with a valid access token.
 *   Set INSTAGRAM_ACCESS_TOKEN in env to enable live fetching.
 *
 * Facebook: uses the Facebook Graph API public endpoint.
 *   Set FACEBOOK_ACCESS_TOKEN in env to enable live fetching.
 *   Without a token, returns null (graceful degradation).
 */

export interface SocialFollowerCounts {
  instagramFollowers: number | null;
  facebookFollowers: number | null;
}

/**
 * Fetch Instagram follower count for a handle using the Instagram Graph API.
 * Requires INSTAGRAM_ACCESS_TOKEN env var (a valid long-lived user/page access token).
 * If not configured, returns null gracefully.
 */
export async function fetchInstagramFollowers(handle: string): Promise<number | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token || !handle) return null;

  try {
    // First: search for the Instagram business account by username
    const searchUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=me&q=${encodeURIComponent(handle)}&access_token=${token}`;

    // Use the pages search endpoint to look up by username
    const url = `https://graph.facebook.com/v19.0/?fields=business_discovery.fields(followers_count)&id=${encodeURIComponent(handle)}&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.business_discovery?.followers_count ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch Facebook page follower count by page name/username.
 * Requires FACEBOOK_ACCESS_TOKEN env var.
 * If not configured, returns null gracefully.
 */
export async function fetchFacebookFollowers(pageHandle: string): Promise<number | null> {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token || !pageHandle) return null;

  try {
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageHandle)}?fields=followers_count,fan_count&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    // followers_count is preferred; fall back to fan_count (likes)
    return data?.followers_count ?? data?.fan_count ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch both Instagram and Facebook follower counts concurrently.
 * Handles null gracefully if handles are missing or tokens not configured.
 */
export async function fetchSocialFollowers(
  instagramHandle?: string | null,
  facebookHandle?: string | null
): Promise<SocialFollowerCounts> {
  const [instagramFollowers, facebookFollowers] = await Promise.all([
    instagramHandle ? fetchInstagramFollowers(instagramHandle) : Promise.resolve(null),
    facebookHandle ? fetchFacebookFollowers(facebookHandle) : Promise.resolve(null),
  ]);
  return { instagramFollowers, facebookFollowers };
}

/**
 * Extract Instagram handle from a profile URL or return the handle as-is.
 * e.g. "https://instagram.com/johndoe" -> "johndoe"
 *      "@johndoe" -> "johndoe"
 *      "johndoe"  -> "johndoe"
 */
export function normalizeInstagramHandle(input: string): string {
  if (!input) return "";
  // Strip URL prefix
  const match = input.match(/instagram\.com\/([^/?#]+)/i);
  if (match) return match[1];
  // Strip @ prefix
  return input.replace(/^@/, "").trim();
}

/**
 * Extract Facebook page handle from a URL or return as-is.
 * e.g. "https://facebook.com/mybrand" -> "mybrand"
 *      "mybrand" -> "mybrand"
 */
export function normalizeFacebookHandle(input: string): string {
  if (!input) return "";
  const match = input.match(/facebook\.com\/([^/?#]+)/i);
  if (match) return match[1];
  return input.replace(/^@/, "").trim();
}
