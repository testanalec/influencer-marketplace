import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    include: {
      // company / influencer are User records; names live on their profiles.
      // (The old select asked User for companyName/name, which crashed this endpoint.)
      company: { select: { email: true, companyProfile: { select: { companyName: true } } } },
      influencer: { select: { email: true, influencerProfile: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
}
