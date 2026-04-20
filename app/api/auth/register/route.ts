import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email, password, role, name, companyName, phone,
      bio, niche, instagram, youtube, tiktok,
      instagramFollowers, youtubeFollowers, tiktokFollowers,
      ratePerPost, industry, description, website, contactPerson,
      googleSignIn,
    } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
    }

    // For Google sign-in users: update existing PENDING_ONBOARDING user
    if (googleSignIn === "true") {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return NextResponse.json({ error: "User not found. Please sign in with Google first." }, { status: 404 });
      }

      if (role === "INFLUENCER") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "INFLUENCER",
            influencerProfile: {
              upsert: {
                create: {
                  name: name || email,
                  phone: phone || "",
                  bio: bio || "",
                  niche: niche || "Lifestyle",
                  instagram: instagram || "",
                  youtube: youtube || "",
                  tiktok: tiktok || "",
                  instagramFollowers: parseInt(instagramFollowers || "0"),
                  youtubeFollowers: parseInt(youtubeFollowers || "0"),
                  tiktokFollowers: parseInt(tiktokFollowers || "0"),
                  ratePerPost: parseFloat(ratePerPost || "0"),
                  status: "PENDING",
                },
                update: {
                  name: name || email,
                  phone: phone || "",
                  bio: bio || "",
                  niche: niche || "Lifestyle",
                  instagram: instagram || "",
                  youtube: youtube || "",
                  tiktok: tiktok || "",
                  instagramFollowers: parseInt(instagramFollowers || "0"),
                  youtubeFollowers: parseInt(youtubeFollowers || "0"),
                  tiktokFollowers: parseInt(tiktokFollowers || "0"),
                  ratePerPost: parseFloat(ratePerPost || "0"),
                  status: "PENDING",
                },
              },
            },
          },
        });
      } else if (role === "COMPANY") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "COMPANY",
            companyProfile: {
              upsert: {
                create: {
                  companyName: companyName || email,
                  phone: phone || "",
                  industry: industry || "Other",
                  description: description || "",
                  website: website || "",
                  contactPerson: contactPerson || "",
                  status: "APPROVED",
                },
                update: {
                  companyName: companyName || email,
                  phone: phone || "",
                  industry: industry || "Other",
                  description: description || "",
                  website: website || "",
                  contactPerson: contactPerson || "",
                  status: "APPROVED",
                },
              },
            },
          },
        });
      }

      return NextResponse.json({ success: true, role });
    }

    // Regular email/password registration
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "INFLUENCER") {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "INFLUENCER",
          influencerProfile: {
            create: {
              name: name || email,
              phone: phone || "",
              bio: bio || "",
              niche: niche || "Lifestyle",
              instagram: instagram || "",
              youtube: youtube || "",
              tiktok: tiktok || "",
              instagramFollowers: parseInt(instagramFollowers || "0"),
              youtubeFollowers: parseInt(youtubeFollowers || "0"),
              tiktokFollowers: parseInt(tiktokFollowers || "0"),
              ratePerPost: parseFloat(ratePerPost || "0"),
              status: "PENDING",
            },
          },
        },
      });
    } else if (role === "COMPANY") {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "COMPANY",
          companyProfile: {
            create: {
              companyName: companyName || email,
              phone: phone || "",
              industry: industry || "Other",
              description: description || "",
              website: website || "",
              contactPerson: contactPerson || "",
              status: "APPROVED",
            },
          },
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
