import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Maps common location codes/abbreviations to full country names
const COUNTRY_MAP: Record<string, string> = {
  "IN": "India",
  "US": "United States",
  "UK": "United Kingdom",
  "GB": "United Kingdom",
  "CA": "Canada",
  "AU": "Australia",
  "AE": "UAE",
  "SG": "Singapore",
  "DE": "Germany",
  "FR": "France",
  "BR": "Brazil",
  "india": "India",
  "united states": "United States",
  "usa": "United States",
  "uk": "United Kingdom",
  "canada": "Canada",
  "australia": "Australia",
  "uae": "UAE",
  "singapore": "Singapore",
  "germany": "Germany",
  "france": "France",
  "brazil": "Brazil",
};

function parseLocation(location: string | null): { country: string | null; city: string | null } {
  if (!location) return { country: null, city: null };

  const loc = location.trim();

  // Direct match against known codes/names
  const direct = COUNTRY_MAP[loc] || COUNTRY_MAP[loc.toLowerCase()];
  if (direct) return { country: direct, city: null };

  // Try "City, Country" format e.g. "Mumbai, India" or "Mumbai, IN"
  const parts = loc.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    const cityPart = parts[0];
    const countryPart = parts[parts.length - 1];
    const mappedCountry = COUNTRY_MAP[countryPart] || COUNTRY_MAP[countryPart.toLowerCase()];
    return {
      country: mappedCountry || countryPart,
      city: cityPart || null,
    };
  }

  // Single value — treat as country if it matches, else city
  return { country: loc, city: null };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const secret = body?.secret;

  const isAdmin = session?.user?.role === "ADMIN";
  const hasSecret = secret && secret === process.env.ADMIN_SECRET;

  if (!isAdmin && !hasSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all profiles where country is null but location is set
  const profiles = await prisma.influencerProfile.findMany({
    where: { country: null },
    select: { id: true, location: true, country: true, city: true },
  });

  let updated = 0;
  const results: any[] = [];

  for (const profile of profiles) {
    const { country, city } = parseLocation(profile.location);
    if (country || city) {
      await prisma.influencerProfile.update({
        where: { id: profile.id },
        data: {
          ...(country ? { country } : {}),
          ...(city && !profile.city ? { city } : {}),
        },
      });
      updated++;
      results.push({ id: profile.id, location: profile.location, country, city });
    }
  }

  return NextResponse.json({
    message: `Updated ${updated} of ${profiles.length} profiles`,
    results,
  });
}
