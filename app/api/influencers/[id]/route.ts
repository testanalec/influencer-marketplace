import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: params.id },
      // Public endpoint: never return the user's password hash, email or phone.
      include: {
        user: { select: { id: true, role: true, createdAt: true } },
      },
    });

    if (!influencer) {
      return NextResponse.json(
        { error: "Influencer not found" },
        { status: 404 }
      );
    }

    if (influencer.status !== "APPROVED") {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    const { phone, contactEmail, ...publicProfile } = influencer;
    return NextResponse.json(publicProfile);
  } catch (err) {
    console.error("Error fetching influencer:", err);
    return NextResponse.json(
      { error: "Failed to fetch influencer" },
      { status: 500 }
    );
  }
}
