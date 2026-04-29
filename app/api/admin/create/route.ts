import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Allow both admin-session users and secret-based bootstrap
    const session = await getServerSession(authOptions);
    const { email, password, name, role, secret } = await request.json();

    const isAdmin = session?.user?.role === "ADMIN";
    const hasSecret = secret && secret === process.env.ADMIN_SECRET;

    if (!isAdmin && !hasSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const validRoles = ["ADMIN", "INFLUENCER", "COMPANY", "PENDING_ONBOARDING"];
    const userRole = validRoles.includes(role) ? role : "PENDING_ONBOARDING";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({ where: { email }, data: { role: userRole } });
      return NextResponse.json({ message: `User ${email} updated to ${userRole} role` });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: userRole },
    });

    // Create profile stub for influencer/company roles
    if (userRole === "INFLUENCER" && name) {
      await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          name,
          bio: "",
          niche: "Other",
          ratePerPost: 0,
          status: "APPROVED", // admin-created influencers are pre-approved
        },
      });
    } else if (userRole === "COMPANY" && name) {
      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          companyName: name,
          industry: "Other",
          description: "",
          budget: "Not specified",
          status: "APPROVED",
        },
      });
    }

    return NextResponse.json({ message: `${userRole} account created for ${email}`, id: user.id });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
