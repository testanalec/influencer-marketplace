import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { influencerProfile: true, companyProfile: true },
        });
        if (!user) return null;
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: (user.influencerProfile?.name || user.companyProfile?.companyName) || user.email,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if this email is in the ADMIN_EMAILS env var
          const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
          const isAdminEmail = adminEmails.includes((user.email || "").toLowerCase());

          const existing = await prisma.user.findUnique({ where: { email: user.email! } });
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email!,
                password: "",
                role: isAdminEmail ? "ADMIN" : "PENDING_ONBOARDING",
              },
            });
          } else if (isAdminEmail && existing.role !== "ADMIN") {
            // Promote existing user to admin if their email is in the admin list
            await prisma.user.update({
              where: { email: user.email! },
              data: { role: "ADMIN" },
            });
          }
        } catch (err) {
          console.error("Google sign-in error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // After Google sign-in or session update, always fetch fresh role from DB
      if ((account?.provider === "google" || trigger === "update") && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return baseUrl + url;
      return baseUrl;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
