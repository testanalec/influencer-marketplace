import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, influencer, company } =
      await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "INFLUENCER") {
      if (!influencer || !influencer.name || !influencer.niche) {
        return NextResponse.json(
          { error: "Missing influencer profile data" },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "INFLUENCER",
          influencerProfile: {
            create: {
              name: influencer.name,
              bio: influencer.bio,
              niche: influencer.niche,
              instagram: influencer.instagram,
              youtube: influencer.youtube,
              tiktok: influencer.tiktok,
              instagramFollowers: influencer.instagramFollowers,
              youtubeFollowers: influencer.youtubeFollowers,
              tiktokFollowers: influencer.tiktokFollowers,
              ratePerPost: influencer.ratePerPost,
              location: influencer.location,
            },
          },
        },
      });

      return NextResponse.json(
        { message: "Influencer registered successfully" },
        { status: 201 }
      );
    } else if (role === "COMPANY") {
      if (!company || !company.companyName || !company.industry) {
        return NextResponse.json(
          { error: "Missing company profile data" },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "COMPANY",
          companyProfile: {
            create: {
              companyName: company.companyName,
              industry: company.industry,
              website: company.website,
              description: company.description,
              budget: company.budget,
            },
          },
        },
      });

      return NextResponse.json(
        { message: "Company registered successfully" },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
