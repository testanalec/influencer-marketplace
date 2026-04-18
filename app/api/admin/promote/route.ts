import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.ADMIN_PROMOTE_SECRET || "analec-admin-2026";

export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json();
    if (secret !== SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    return NextResponse.json({ success: true, email: user.email, role: user.role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
