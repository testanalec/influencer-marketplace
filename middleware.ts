import { withAuth } from "next-auth/middleware";
import { NextRequest } from "next/server";

export const middleware = withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token;

    // Protect dashboard routes
    if (
      req.nextUrl.pathname.startsWith("/dashboard/influencer") &&
      token?.role !== "INFLUENCER"
    ) {
      return null;
    }

    if (
      req.nextUrl.pathname.startsWith("/dashboard/company") &&
      token?.role !== "COMPANY"
    ) {
      return null;
    }

    return null;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
