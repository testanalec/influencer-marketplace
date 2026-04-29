import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Map full country names to their common codes stored in legacy location field
const COUNTRY_CODES: Record<string, string[]> = {
  "india": ["IN", "India"],
  "united states": ["US", "USA", "United States"],
  "united kingdom": ["UK", "GB", "United Kingdom"],
  "canada": ["CA", "Canada"],
  "australia": ["AU", "Australia"],
  "uae": ["AE", "UAE"],
  "singapore": ["SG", "Singapore"],
  "germany": ["DE", "Germany"],
  "france": ["FR", "France"],
  "brazil": ["BR", "Brazil"],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche");
    const minFollowers = searchParams.get("minFollowers");
    const maxRate = searchParams.get("maxRate");
    const name = searchParams.get("name");
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const includeAll = searchParams.get("includeAll") === "true";
    const rawLimit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const limit = Math.min(rawLimit, 200); // cap at 200
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    const where: any = {};

    if (!includeAll) {
      where.status = "APPROVED";
    }

    if (niche && niche !== "") {
      // Case-insensitive niche match
      where.niche = { equals: niche, mode: "insensitive" };
    }

    if (name && name.trim() !== "") {
      where.name = { contains: name.trim(), mode: "insensitive" };
    }

    if (country && country !== "") {
      // Build OR conditions: match country field, or location containing any alias (e.g. "IN", "India")
      const aliases = COUNTRY_CODES[country.toLowerCase()] || [country];
      const locationConditions = aliases.map((alias: string) => ({
        location: { contains: alias, mode: "insensitive" as const },
      }));
      where.OR = [
        { country: { equals: country, mode: "insensitive" } },
        ...locationConditions,
      ];
    }

    if (city && city.trim() !== "") {
      const cityConditions = [
        { city: { contains: city.trim(), mode: "insensitive" } },
        { location: { contains: city.trim(), mode: "insensitive" } },
      ];
      // If we already have OR from country, combine with AND
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: cityConditions }];
        delete where.OR;
      } else {
        where.OR = cityConditions;
      }
    }

    if (maxRate && maxRate !== "") {
      where.ratePerPost = { lte: Number(maxRate) };
    }

    let influencers = await prisma.influencerProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        name: true,
        bio: true,
        avatar: true,
        niche: true,
        country: true,
        city: true,
        location: true,
        status: true,
        instagram: true,
        youtube: true,
        twitter: true,
        tiktok: true,
        facebook: true,
        linkedin: true,
        instagramFollowers: true,
        youtubeFollowers: true,
        twitterFollowers: true,
        tiktokFollowers: true,
        facebookFollowers: true,
        ratePerPost: true,
        currency: true,
        phone: true,
        contactEmail: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, role: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    if (minFollowers) {
      const minFollowersNum = parseInt(minFollowers);
      influencers = influencers.filter((inf: any) => {
        const totalFollowers =
          (inf.instagramFollowers || 0) +
          (inf.youtubeFollowers || 0) +
          (inf.tiktokFollowers || 0) +
          (inf.twitterFollowers || 0) +
          (inf.facebookFollowers || 0);
        return totalFollowers >= minFollowersNum;
      });
    }

    return NextResponse.json(influencers, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("Error fetching influencers:", err);
    return NextResponse.json([], { status: 200 });
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
