import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      include: {
        influencer: { include: { influencerProfile: true } },
        company: { include: { companyProfile: true } },
      },
    });

    return NextResponse.json(deals);
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

    const commission = dealValue * 0.1;

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

      if (influencerEmail && resend) {
        await resend.emails.send({
          from: "InfluMarket <notifications@influmarketplace.com>",
          to: influencerEmail,
          subject: `New Collaboration Proposal: ${title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">🎉 You have a new collaboration proposal!</h2>
              <p>Hi ${influencerUser?.influencerProfile?.name || "there"},</p>
              <p><strong>${companyName}</strong> has sent you a collaboration proposal on InfluMarket.</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Campaign:</strong> ${title}</p>
                <p><strong>Deal Value:</strong> ₹${dealValue.toLocaleString()}</p>
                <p><strong>Description:</strong> ${description}</p>
              </div>
              <p>Log in to your InfluMarket account to review and respond to this proposal.</p>
              <a href="${process.env.NEXTAUTH_URL || 'https://influmarket.in'}/dashboard/influencer" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                View Proposal
              </a>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">InfluMarket - Connect Brands with Creators</p>
            </div>
          `,
        });
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
