import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin-only full creator list (all statuses, with contact details).
// Replaces the old public `/api/influencers?includeAll=true`, which exposed emails
// and phone numbers to anyone and was capped at 200 rows.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const influencers = await prisma.influencerProfile.findMany({
    include: { user: { select: { id: true, email: true, role: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(influencers, { headers: { "Cache-Control": "private, no-store" } });
}
