import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendEmail, layout, esc, BASE_URL } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const deals = await prisma.deal.findMany({
      where: {
        OR: [{ companyId: session.user.id }, { influencerId: session.user.id }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        dealValue: true,
        commission: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        influencerId: true,
        influencer: {
          select: {
            id: true,
            email: true,
            influencerProfile: {
              select: { id: true, name: true, avatar: true, niche: true, ratePerPost: true },
            },
          },
        },
        company: {
          select: {
            id: true,
            email: true,
            companyProfile: {
              select: { id: true, companyName: true, industry: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(deals, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("Error fetching deals:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
      return NextResponse.json({ error: "Only companies can create deals" }, { status: 403 });
    }

    const { influencerId, title, description, dealValue } = await request.json();

    if (!influencerId || !title || !description || !dealValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const amount = Number(dealValue);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Deal value must be a positive number" }, { status: 400 });
    }
    const target = await prisma.influencerProfile.findUnique({ where: { userId: influencerId }, select: { status: true } });
    if (!target || target.status !== "APPROVED") {
      return NextResponse.json({ error: "This creator is not available for proposals" }, { status: 400 });
    }

    const commission = amount * 0.1;

    const deal = await prisma.deal.create({
      data: {
        companyId: session.user.id,
        influencerId,
        title,
        description,
        dealValue: amount,
        commission,
        status: "PENDING",
      },
    });

    // Send email notification to influencer
    try {
      const influencerUser = await prisma.user.findUnique({
        where: { id: influencerId },
        include: { influencerProfile: true },
      });

      const companyUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { companyProfile: true },
      });

      const influencerEmail =
        influencerUser?.influencerProfile?.contactEmail ||
        (influencerUser?.email?.includes("@youtube-sync.internal") ? null : influencerUser?.email);

      const companyName = companyUser?.companyProfile?.companyName || session.user.name || "A brand";

      if (influencerEmail) {
        const html = layout(
          "🎉 You have a new collaboration proposal!",
          `<p>Hi ${esc(influencerUser?.influencerProfile?.name || "there")},</p>
           <p><strong>${esc(companyName)}</strong> has sent you a collaboration proposal on InfluMarket.</p>
           <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
             <p><strong>Campaign:</strong> ${esc(title)}</p>
             <p><strong>Deal Value:</strong> ₹${esc(Number(dealValue).toLocaleString("en-IN"))}</p>
             <p><strong>Description:</strong> ${esc(description)}</p>
           </div>
           <p>Log in to review and respond to this proposal.</p>`,
          { label: "View Proposal", href: `${BASE_URL}/dashboard/influencer` }
        );
        await sendEmail({ to: influencerEmail, subject: `New Collaboration Proposal: ${title}`, html });
      }
    } catch (emailErr) {
      console.error("Failed to send email notification:", emailErr);
      // Don't fail the deal creation if email fails
    }

    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    console.error("Error creating deal:", err);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
