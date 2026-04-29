import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, bio, phone, niche, location, country, city, avatar, contactEmail,
    instagram, youtube, twitter, tiktok, facebook, linkedin,
    instagramFollowers, youtubeFollowers, twitterFollowers, tiktokFollowers, facebookFollowers,
    ratePerPost, currency,
  } = body;

  // Build combined location string from city/country
  const locationStr = city && country ? `${city}, ${country}` : city || country || location;

  // Check if profile exists; create if not (for Google sign-in users)
  const existing = await prisma.influencerProfile.findUnique({ where: { userId: session.user.id } });

  const data: any = {
    ...(name !== undefined && { name }),
    ...(bio !== undefined && { bio }),
    ...(phone !== undefined && { phone }),
    ...(niche !== undefined && { niche }),
    ...(locationStr !== undefined && { location: locationStr }),
    ...(country !== undefined && { country }),
    ...(city !== undefined && { city }),
    ...(avatar !== undefined && { avatar }),
    ...(contactEmail !== undefined && { contactEmail }),
    ...(instagram !== undefined && { instagram }),
    ...(youtube !== undefined && { youtube }),
    ...(twitter !== undefined && { twitter }),
    ...(tiktok !== undefined && { tiktok }),
    ...(facebook !== undefined && { facebook }),
    ...(linkedin !== undefined && { linkedin }),
    ...(instagramFollowers !== undefined && { instagramFollowers: Number(instagramFollowers) }),
    ...(youtubeFollowers !== undefined && { youtubeFollowers: Number(youtubeFollowers) }),
    ...(twitterFollowers !== undefined && { twitterFollowers: Number(twitterFollowers) }),
    ...(tiktokFollowers !== undefined && { tiktokFollowers: Number(tiktokFollowers) }),
    ...(facebookFollowers !== undefined && { facebookFollowers: Number(facebookFollowers) }),
    ...(ratePerPost !== undefined && { ratePerPost: Number(ratePerPost) }),
    ...(currency !== undefined && { currency }),
  };

  let profile;
  if (!existing) {
    profile = await prisma.influencerProfile.create({
      data: {
        userId: session.user.id,
        name: name || session.user.name || "Unnamed",
        bio: bio || "",
        niche: niche || "Other",
        ratePerPost: ratePerPost ? Number(ratePerPost) : 0,
        status: "PENDING",
        ...data,
      },
      include: { user: { select: { email: true } } },
    });
    // Update user role to INFLUENCER
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "INFLUENCER" } });
  } else {
    profile = await prisma.influencerProfile.update({
      where: { userId: session.user.id },
      data,
      include: { user: { select: { email: true } } },
    });
  }

  return NextResponse.json(profile);
}
