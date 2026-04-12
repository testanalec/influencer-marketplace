import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchInstagramFollowers,
  fetchFacebookFollowers,
  normalizeInstagramHandle,
  normalizeFacebookHandle,
} from "@/lib/social";

/**
 * POST /api/social/sync
 * Admin-only endpoint to sync Instagram and Facebook follower counts
 * for existing influencer profiles.
 *
 * Body (all optional):
 *   influencerId?: string  — sync a single influencer by their profile ID
 *   limit?: number         — max number of profiles to sync (default: 50)
 *
 * Requires INSTAGRAM_ACCESS_TOKEN and/or FACEBOOK_ACCESS_TOKEN env vars.
 * Profiles without handles for a platform are skipped for that platform.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    let body: { influencerId?: string; limit?: number } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const limit = body.limit ?? 50;

    // Fetch profiles to sync
    const profiles = await prisma.influencerProfile.findMany({
      where: body.influencerId ? { id: body.influencerId } : undefined,
      select: {
        id: true,
        name: true,
        instagram: true,
        facebook: true,
        instagramFollowers: true,
        facebookFollowers: true,
      },
      take: limit,
    });

    let instagramSynced = 0;
    let facebookSynced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const updates: { instagramFollowers?: number; facebookFollowers?: number } = {};

        // Sync Instagram
        if (profile.instagram) {
          const handle = normalizeInstagramHandle(profile.instagram);
          if (handle) {
            const count = await fetchInstagramFollowers(handle);
            if (count !== null) {
              updates.instagramFollowers = count;
              instagramSynced++;
            }
          }
        }

        // Sync Facebook
        if (profile.facebook) {
          const handle = normalizeFacebookHandle(profile.facebook);
          if (handle) {
            const count = await fetchFacebookFollowers(handle);
            if (count !== null) {
              updates.facebookFollowers = count;
              facebookSynced++;
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          await prisma.influencerProfile.update({
            where: { id: profile.id },
            data: updates,
          });
        } else {
          skipped++;
        }
      } catch (err) {
        errors.push(`Profile ${profile.id} (${profile.name}): ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Social sync complete. Instagram: ${instagramSynced} updated, Facebook: ${facebookSynced} updated, ${skipped} skipped (no handles or tokens)`,
      instagramSynced,
      facebookSynced,
      skipped,
      totalProfiles: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Social sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync social followers" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/sync
 * Returns status: whether Instagram and Facebook tokens are configured.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    instagramConfigured: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    facebookConfigured: !!process.env.FACEBOOK_ACCESS_TOKEN,
    message: !process.env.INSTAGRAM_ACCESS_TOKEN && !process.env.FACEBOOK_ACCESS_TOKEN
      ? "No social API tokens configured. Add INSTAGRAM_ACCESS_TOKEN and/or FACEBOOK_ACCESS_TOKEN to Vercel environment variables."
      : "Social API tokens configured.",
  });
}
