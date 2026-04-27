import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/deals/messages?dealId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get("dealId");
  if (!dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  // Verify user is part of this deal
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ companyId: session.user.id }, { influencerId: session.user.id }],
    },
  });
  if (!deal) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const messages = await prisma.dealMessage.findMany({
    where: { dealId },
    include: {
      sender: {
        include: { influencerProfile: true, companyProfile: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/deals/messages
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { dealId, body } = await req.json();
  if (!dealId || !body?.trim()) return NextResponse.json({ error: "dealId and body required" }, { status: 400 });

  // Verify user is part of this deal
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ companyId: session.user.id }, { influencerId: session.user.id }],
    },
  });
  if (!deal) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const message = await prisma.dealMessage.create({
    data: { dealId, senderId: session.user.id, body: body.trim() },
    include: {
      sender: {
        include: { influencerProfile: true, companyProfile: true },
      },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
