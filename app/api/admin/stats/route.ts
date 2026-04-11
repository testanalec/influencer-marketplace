import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profiles = await prisma.influencerProfile.findMany({
      select: { niche: true },
    });

    const total = profiles.length;
    const byNiche: Record<string, number> = {};
    for (const p of profiles) {
      byNiche[p.niche] = (byNiche[p.niche] || 0) + 1;
    }

    return NextResponse.json({ total, byNiche });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
