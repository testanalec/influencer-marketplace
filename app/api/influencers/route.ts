import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche");
    const minFollowers = searchParams.get("minFollowers");

    const where: any = {};

    if (niche && niche !== "") {
      where.niche = niche;
    }

    let influencers = await prisma.influencerProfile.findMany({
      where,
      include: {
        user: true,
      },
    });

    if (minFollowers) {
      const minFollowersNum = parseInt(minFollowers);
      influencers = influencers.filter((inf) => {
        const totalFollowers =
          (inf.instagramFollowers || 0) +
          (inf.youtubeFollowers || 0) +
          (inf.tiktokFollowers || 0) +
          (inf.twitterFollowers || 0);
        return totalFollowers >= minFollowersNum;
      });
    }

    return NextResponse.json(influencers);
  } catch (err) {
    console.error("Error fetching influencers:", err);
    return NextResponse.json(
      { error: "Failed to fetch influencers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, bio, niche, ratePerPost } = await request.json();

    if (!name || !bio || !niche || !ratePerPost) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const influencer = await prisma.influencerProfile.create({
      data: {
        name,
        bio,
        niche,
        ratePerPost,
        userId: "default", // This would be replaced with actual user ID in production
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(influencer, { status: 201 });
  } catch (err) {
    console.error("Error creating influencer:", err);
    return NextResponse.json(
      { error: "Failed to create influencer" },
      { status: 500 }
    );
  }
}
