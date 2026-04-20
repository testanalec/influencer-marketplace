import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await request.json();
  if (!["INFLUENCER", "COMPANY"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (role === "INFLUENCER") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "INFLUENCER",
        influencerProfile: {
          create: {
            name: session.user.name || session.user.email,
            bio: "Update your bio in your profile.",
            niche: "Lifestyle",
            ratePerPost: 0,
            status: "PENDING",
          },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "COMPANY",
        companyProfile: {
          create: {
            companyName: session.user.name || session.user.email,
            industry: "Other",
            description: "Update your company description in your profile.",
            status: "APPROVED",
          },
        },
      },
    });
  }

  return NextResponse.json({ success: true, role });
}
