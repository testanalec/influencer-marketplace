import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  sendEmail,
  notifyAdmins,
  welcomeInfluencerEmail,
  welcomeCompanyEmail,
  adminNewSignupEmail,
} from "@/lib/email";

const toInt = (v: unknown) => {
  const n = parseInt(String(v ?? "0").replace(/,/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const toFloat = (v: unknown) => {
  const n = parseFloat(String(v ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      password, role, name, companyName, phone,
      bio, niche, instagram, youtube, tiktok,
      instagramFollowers, youtubeFollowers, tiktokFollowers,
      ratePerPost, industry, description, website, budget,
      googleSignIn, avatar,
    } = body;
    let email: string = String(body.email || "").trim();

    if (!["INFLUENCER", "COMPANY"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    // Profile photo arrives already shrunk by the browser as a data URL.
    const photo =
      typeof avatar === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(avatar) && avatar.length < 1_500_000
        ? avatar
        : undefined;

    const influencerData = () => ({
      name: name || email,
      phone: phone || "",
      bio: bio || "",
      niche: niche || "Lifestyle",
      instagram: instagram || "",
      youtube: youtube || "",
      tiktok: tiktok || "",
      instagramFollowers: toInt(instagramFollowers),
      youtubeFollowers: toInt(youtubeFollowers),
      tiktokFollowers: toInt(tiktokFollowers),
      ratePerPost: toFloat(ratePerPost),
      ...(photo ? { avatar: photo } : {}),
      status: "PENDING",
    });

    // Only fields that exist on CompanyProfile in prisma/schema.prisma.
    // (The old code sent `contactPerson`, which isn't a column, and omitted the
    //  required `budget`, so every brand signup failed with a 500.)
    const companyData = () => ({
      companyName: companyName || email,
      phone: phone || "",
      industry: industry || "Other",
      description: description || "",
      website: website || "",
      budget: budget ? String(budget) : "Not specified",
      status: "APPROVED",
    });

    // ---- Google sign-in users finishing their profile ----
    if (googleSignIn === "true") {
      // Must be the signed-in user. Previously anyone could pass any email here
      // and overwrite that account's role and profile.
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Please sign in with Google first." }, { status: 401 });
      }
      email = session.user.email;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return NextResponse.json({ error: "User not found. Please sign in with Google first." }, { status: 404 });
      }
      // Don't let an onboarding form change an admin or switch an existing role.
      if (existingUser.role !== "PENDING_ONBOARDING" && existingUser.role !== role) {
        return NextResponse.json({ error: "This account is already set up with a different role." }, { status: 400 });
      }

      if (role === "INFLUENCER") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "INFLUENCER",
            influencerProfile: { upsert: { create: influencerData(), update: influencerData() } },
          },
        });
      } else {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "COMPANY",
            companyProfile: { upsert: { create: companyData(), update: companyData() } },
          },
        });
      }

      await sendSignupEmails(role, email, name, companyName, existingUser.role === "PENDING_ONBOARDING");
      return NextResponse.json({ success: true, role });
    }

    // ---- Regular email/password registration ----
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (!password || String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use. Try signing in instead." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "INFLUENCER") {
      await prisma.user.create({
        data: { email, password: hashedPassword, role: "INFLUENCER", influencerProfile: { create: influencerData() } },
      });
    } else {
      await prisma.user.create({
        data: { email, password: hashedPassword, role: "COMPANY", companyProfile: { create: companyData() } },
      });
    }

    await sendSignupEmails(role, email, name, companyName, true);
    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// Welcome email to the new user + heads-up to admins. Failures are logged, never block signup.
async function sendSignupEmails(role: string, email: string, name?: string, companyName?: string, isNew = true) {
  if (!isNew) return; // profile re-submission, not a new signup
  try {
    if (role === "INFLUENCER") {
      const display = name || email;
      await Promise.all([
        sendEmail({ to: email, ...welcomeInfluencerEmail(display) }),
        notifyAdmins(adminNewSignupEmail("Creator", display, email)),
      ]);
    } else {
      const display = companyName || email;
      await Promise.all([
        sendEmail({ to: email, ...welcomeCompanyEmail(display) }),
        notifyAdmins(adminNewSignupEmail("Brand", display, email)),
      ]);
    }
  } catch (err) {
    console.error("[register] signup emails failed:", err);
  }
}
