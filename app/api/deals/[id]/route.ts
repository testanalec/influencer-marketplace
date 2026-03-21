import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    if (deal.influencerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this deal" },
        { status: 403 }
      );
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updatedDeal);
  } catch (err) {
    console.error("Error updating deal:", err);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}
