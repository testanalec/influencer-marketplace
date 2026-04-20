import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// One-time bulk cleanup endpoint
// Approves 35 influencers per niche, deletes the rest (all PENDING)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const niches = ["Lifestyle","Fashion","Tech","Food","Travel","Fitness","Beauty","Gaming","Education","Finance","Other"];
  const KEEP_PER_NICHE = 35;

  const allPending = await prisma.influencerProfile.findMany({
    where: { status: "PENDING" },
    select: { id: true, userId: true, niche: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const toApprove: string[] = [];
  const toDelete: string[] = [];
  const nicheCount: Record<string, number> = {};

  for (const influencer of allPending) {
    const niche = influencer.niche || "Other";
    nicheCount[niche] = (nicheCount[niche] || 0) + 1;
    if (nicheCount[niche] <= KEEP_PER_NICHE) {
      toApprove.push(influencer.id);
    } else {
      toDelete.push(influencer.id);
    }
  }

  // Approve selected influencers
  const approveResult = await prisma.influencerProfile.updateMany({
    where: { id: { in: toApprove } },
    data: { status: "APPROVED" },
  });

  // Delete the rest (profile first, then user)
  const profilesToDelete = await prisma.influencerProfile.findMany({
    where: { id: { in: toDelete } },
    select: { userId: true },
  });
  const userIdsToDelete = profilesToDelete.map((p) => p.userId);

  await prisma.influencerProfile.deleteMany({ where: { id: { in: toDelete } } });
  await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } });

  return NextResponse.json({
    success: true,
    approved: approveResult.count,
    deleted: toDelete.length,
    nicheBreakdown: nicheCount,
  });
}
