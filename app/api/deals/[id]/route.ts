import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const BASE_URL = process.env.NEXTAUTH_URL || "https://influmarket.in";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      include: {
        influencer: { include: { influencerProfile: true } },
        company: { include: { companyProfile: true } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const isInfluencer = deal.influencerId === session.user.id;
    const isCompany = deal.companyId === session.user.id;

    // Influencer can ACCEPT or REJECT a PENDING deal
    if (["ACCEPTED", "REJECTED"].includes(status)) {
      if (!isInfluencer) {
        return NextResponse.json({ error: "Only the influencer can accept or reject proposals" }, { status: 403 });
      }
      if (deal.status !== "PENDING") {
        return NextResponse.json({ error: "Deal is no longer pending" }, { status: 400 });
      }
    }

    // Company can mark ACCEPTED deal as COMPLETED
    if (status === "COMPLETED") {
      if (!isCompany) {
        return NextResponse.json({ error: "Only the brand can mark a deal as completed" }, { status: 403 });
      }
      if (deal.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Can only complete an accepted deal" }, { status: 400 });
      }
    }

    if (!isInfluencer && !isCompany) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: params.id },
      data: { status },
    });

    // Send email notifications on status changes
    try {
      if (resend) {
        const influencerName = deal.influencer.influencerProfile?.name || "the influencer";
        const companyName = deal.company.companyProfile?.companyName || "the brand";
        const companyEmail = deal.company.email?.includes("@youtube-sync.internal") ? null : deal.company.email;
        const influencerEmail = deal.influencer.influencerProfile?.contactEmail ||
          (deal.influencer.email?.includes("@youtube-sync.internal") ? null : deal.influencer.email);

        if (status === "ACCEPTED" && companyEmail) {
          await resend.emails.send({
            from: "InfluMarket <noreply@influmarket.in>",
            to: companyEmail,
            subject: `✅ ${influencerName} accepted your proposal: ${deal.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Great news! Proposal Accepted</h2>
                <p>Hi ${companyName},</p>
                <p><strong>${influencerName}</strong> has accepted your collaboration proposal <strong>"${deal.title}"</strong>.</p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Deal Value:</strong> ₹${deal.dealValue.toLocaleString()}</p>
                </div>
                <p>You can now message ${influencerName} directly through the platform to coordinate next steps.</p>
                <a href="${BASE_URL}/dashboard/company" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 8px;">
                  View Dashboard
                </a>
              </div>
            `,
          });
        }

        if (status === "REJECTED" && companyEmail) {
          await resend.emails.send({
            from: "InfluMarket <noreply@influmarket.in>",
            to: companyEmail,
            subject: `Proposal update: ${deal.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Proposal Not Accepted</h2>
                <p>Hi ${companyName},</p>
                <p><strong>${influencerName}</strong> was unable to take on your collaboration proposal <strong>"${deal.title}"</strong> at this time.</p>
                <p>Don't be discouraged — there are thousands of great creators on InfluMarket. Browse others who might be a great fit.</p>
                <a href="${BASE_URL}/influencers" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 8px;">
                  Browse Influencers
                </a>
              </div>
            `,
          });
        }

        if (status === "COMPLETED" && influencerEmail) {
          await resend.emails.send({
            from: "InfluMarket <noreply@influmarket.in>",
            to: influencerEmail,
            subject: `🎉 Deal completed: ${deal.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Deal Completed!</h2>
                <p>Hi ${influencerName},</p>
                <p><strong>${companyName}</strong> has marked the collaboration <strong>"${deal.title}"</strong> as completed.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Deal Value:</strong> ₹${deal.dealValue.toLocaleString()}</p>
                </div>
                <p>Great work! Check your dashboard to see your updated earnings.</p>
                <a href="${BASE_URL}/dashboard/influencer" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 8px;">
                  View Dashboard
                </a>
              </div>
            `,
          });
        }
      }
    } catch (emailErr) {
      console.error("Status email error:", emailErr);
    }

    return NextResponse.json(updatedDeal);
  } catch (err) {
    console.error("Error updating deal:", err);
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}
