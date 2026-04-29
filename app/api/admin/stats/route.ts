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

    // Run all counts in parallel — no more fetching all records
    const [
      totalInfluencers,
      pendingInfluencers,
      totalCompanies,
      totalDeals,
      dealsByStatus,
      nicheGroups,
    ] = await Promise.all([
      prisma.influencerProfile.count(),
      prisma.influencerProfile.count({ where: { status: "PENDING" } }),
      prisma.companyProfile.count(),
      prisma.deal.count(),
      prisma.deal.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.influencerProfile.groupBy({ by: ["niche"], _count: { niche: true } }),
    ]);

    const byNiche: Record<string, number> = {};
    for (const g of nicheGroups) {
      byNiche[g.niche] = g._count.niche;
    }

    const byStatus: Record<string, number> = {};
    for (const g of dealsByStatus) {
      byStatus[g.status] = g._count.status;
    }

    return NextResponse.json(
      { total: totalInfluencers, pendingInfluencers, totalCompanies, totalDeals, byNiche, byStatus },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
