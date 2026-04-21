import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { companyName, industry, website, description, phone, budget } = body;

  const profile = await prisma.companyProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(companyName !== undefined && { companyName }),
      ...(industry !== undefined && { industry }),
      ...(website !== undefined && { website }),
      ...(description !== undefined && { description }),
      ...(phone !== undefined && { phone }),
      ...(budget !== undefined && { budget: Number(budget) }),
    },
  });

  return NextResponse.json(profile);
}
