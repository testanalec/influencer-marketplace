import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pending = await prisma.influencerProfile.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: { email: true, id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ pending });
}
