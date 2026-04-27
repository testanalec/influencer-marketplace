import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// This route handles post-Google-login redirect based on user role
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role;

  if (role === "INFLUENCER") {
    return NextResponse.redirect(new URL("/dashboard/influencer", req.url));
  } else if (role === "COMPANY") {
    return NextResponse.redirect(new URL("/dashboard/company", req.url));
  } else if (role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", req.url));
  } else if (role === "PENDING_ONBOARDING") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Default fallback
  return NextResponse.redirect(new URL("/", req.url));
}
