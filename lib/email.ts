import { Resend } from "resend";

// One place for all outgoing email.
// - Sender comes from EMAIL_FROM so the domain can be changed without code edits.
//   The domain in EMAIL_FROM MUST be verified in Resend (DNS records added), or every send is rejected.
// - Resend v4 does NOT throw on failure; it returns { error }. We log it so failures show up in Vercel logs.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM || "InfluMarket <noreply@influmarket.in>";
export const BASE_URL = process.env.NEXTAUTH_URL || "https://influmarket.in";

// Accounts created by the YouTube sync have placeholder addresses that can't receive mail.
export function isDeliverable(email?: string | null): email is string {
  return !!email && email.includes("@") && !email.endsWith("@youtube-sync.internal");
}

// Escape user-supplied text before putting it into email HTML.
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function layout(heading: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const button = cta
    ? `<a href="${cta.href}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">${esc(cta.label)}</a>`
    : "";
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;">
      <h2 style="color:#7c3aed;">${heading}</h2>
      ${bodyHtml}
      ${button}
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">InfluMarket · Connecting brands with creators · ${BASE_URL.replace(/^https?:\/\//, "")}</p>
    </div>`;
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!resend) {
    console.error("[email] RESEND_API_KEY is not set; skipped:", opts.subject);
    return false;
  }
  if (!isDeliverable(opts.to)) {
    console.warn("[email] undeliverable address; skipped:", opts.subject);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: EMAIL_FROM, ...opts });
    if (error) {
      console.error("[email] Resend rejected:", opts.subject, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", opts.subject, err);
    return false;
  }
}

// ---------- Templates ----------

export function welcomeInfluencerEmail(name: string) {
  return {
    subject: "Welcome to InfluMarket — your creator profile is under review",
    html: layout(
      `Welcome, ${esc(name)}! 🎉`,
      `<p>Thanks for joining InfluMarket as a creator.</p>
       <p>Our team reviews every new profile before it appears to brands. You'll get another email as soon as yours is approved.</p>
       <p>Meanwhile, complete your profile — a clear bio, your niche, follower counts and rate per post help brands pick you faster.</p>`,
      { label: "Complete my profile", href: `${BASE_URL}/dashboard/influencer/profile` }
    ),
  };
}

export function welcomeCompanyEmail(companyName: string) {
  return {
    subject: "Welcome to InfluMarket — start finding creators",
    html: layout(
      `Welcome, ${esc(companyName)}!`,
      `<p>Your brand account is ready. Browse verified creators by niche, followers and budget, and send your first collaboration proposal.</p>`,
      { label: "Browse creators", href: `${BASE_URL}/influencers` }
    ),
  };
}

export function influencerApprovedEmail(name: string) {
  return {
    subject: "You're approved! Your InfluMarket profile is now live",
    html: layout(
      `You're live, ${esc(name)}! ✅`,
      `<p>Your creator profile has been approved and is now visible to brands on InfluMarket.</p>
       <p>When a brand sends you a proposal, we'll email you right away.</p>`,
      { label: "Go to my dashboard", href: `${BASE_URL}/dashboard/influencer` }
    ),
  };
}

export function influencerRejectedEmail(name: string) {
  return {
    subject: "Update on your InfluMarket profile",
    html: layout(
      `Hi ${esc(name)},`,
      `<p>We couldn't approve your creator profile yet. This usually means some details are missing — like your social links, follower counts or a bio.</p>
       <p>Please update your profile and our team will take another look.</p>`,
      { label: "Update my profile", href: `${BASE_URL}/dashboard/influencer/profile` }
    ),
  };
}

export function adminNewSignupEmail(kind: "Creator" | "Brand", name: string, email: string) {
  return {
    subject: `New ${kind} signup: ${name}`,
    html: layout(
      `New ${kind} signup`,
      `<p><strong>${esc(name)}</strong> (${esc(email)}) just registered.</p>
       ${kind === "Creator" ? "<p>Their profile is waiting for approval.</p>" : ""}`,
      { label: "Open admin dashboard", href: `${BASE_URL}/dashboard/admin` }
    ),
  };
}

// Notify admins (comma-separated ADMIN_EMAILS) — never blocks the caller.
export async function notifyAdmins(content: { subject: string; html: string }) {
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
  await Promise.all(admins.map((to) => sendEmail({ to, ...content })));
}
