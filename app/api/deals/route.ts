import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const deals = await prisma.deal.findMany({
      where: {
        OR: [
          { companyId: session.user.id },
          { influencerId: session.user.id },
        ],
      },
    });

    return NextResponse.json(deals);
  } catch (err) {
    console.error("Error fetching deals:", err);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.user.role !== "COMPANY") {
      return NextResponse.json(
        { error: "Only companies can create deals" },
        { status: 403 }
      );
    }

    const { influencerId, title, description, dealValue } =
      await request.json();

    if (!influencerId || !title || !description || !dealValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commission = dealValue * 0.1; // 10% commission

    const deal = await prisma.deal.create({
      data: {
        companyId: session.user.id,
        influencerId,
        title,
        description,
        dealValue,
        commission,
        status: "PENDING",
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    console.error("Error creating deal:", err);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
