import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, influencerApprovedEmail, influencerRejectedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, status } = await request.json();
  if (!userId || !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const before = await prisma.influencerProfile.findUnique({
    where: { userId },
    select: { status: true },
  });

  const profile = await prisma.influencerProfile.update({
    where: { userId },
    data: { status },
    include: { user: { select: { email: true } } },
  });

  // Tell the creator — only when the status actually changes.
  if (before?.status !== status) {
    const to = profile.contactEmail || profile.user.email;
    const content = status === "APPROVED" ? influencerApprovedEmail(profile.name) : influencerRejectedEmail(profile.name);
    await sendEmail({ to, ...content });
  }

  return NextResponse.json({ success: true, status });
}
