import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If this email is registered, you will receive a reset link shortly.",
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in DB
    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expires },
      create: { email, token, expires },
    });

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "InfluMarket <noreply@influmarket.in>",
      to: email,
      subject: "Reset your InfluMarket password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Reset Your Password</h2>
          <p>You requested a password reset for your InfluMarket account.</p>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #6b7280; font-size: 12px;">
            Or copy this link: ${resetUrl}
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "If this email is registered, you will receive a reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email. Please try again." },
      { status: 500 }
    );
  }
}
