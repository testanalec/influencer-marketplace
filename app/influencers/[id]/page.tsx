import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

const SITE_URL = "https://influmarket.in";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const inf = await prisma.influencerProfile.findUnique({
      where: { id: params.id },
      select: { name: true, bio: true, niche: true, avatar: true, country: true, city: true, ratePerPost: true },
    });

    if (!inf) return { title: "Influencer Not Found" };

    const location = [inf.city, inf.country].filter(Boolean).join(", ");
    const title = `${inf.name} — ${inf.niche} Influencer${location ? ` in ${location}` : ""}`;
    const description = inf.bio
      ? inf.bio.slice(0, 155)
      : `${inf.name} is a ${inf.niche} creator on InfluMarket. Rate: ₹${inf.ratePerPost?.toLocaleString()} per post.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/influencers/${params.id}`,
        type: "profile",
        images: inf.avatar ? [{ url: inf.avatar, alt: inf.name }] : [{ url: "/og-image.png" }],
      },
      twitter: { card: "summary_large_image", title, description },
      alternates: { canonical: `${SITE_URL}/influencers/${params.id}` },
    };
  } catch {
    return { title: "Influencer Profile | InfluMarket" };
  }
}

export default async function InfluencerProfilePage({ params }: Props) {
  // Fetch minimal data server-side for JSON-LD structured data
  let jsonLd = null;
  try {
    const inf = await prisma.influencerProfile.findUnique({
      where: { id: params.id },
      select: {
        name: true, bio: true, niche: true, avatar: true,
        instagram: true, youtube: true, twitter: true,
        country: true, city: true,
      },
    });

    if (inf) {
      const sameAs = [
        inf.instagram && `https://instagram.com/${inf.instagram.replace("@", "")}`,
        inf.youtube && `https://youtube.com/@${inf.youtube.replace("@", "")}`,
        inf.twitter && `https://x.com/${inf.twitter.replace("@", "")}`,
      ].filter(Boolean);

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: inf.name,
        description: inf.bio,
        image: inf.avatar,
        url: `${SITE_URL}/influencers/${params.id}`,
        knowsAbout: inf.niche,
        address: { "@type": "PostalAddress", addressCountry: inf.country, addressLocality: inf.city },
        ...(sameAs.length > 0 && { sameAs }),
      };
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileClient params={params} />
    </>
  );
}
