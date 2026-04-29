import { Metadata } from "next";
import BrowseClient from "./BrowseClient";

export const metadata: Metadata = {
  title: "Browse Influencers",
  description:
    "Discover verified influencers across India. Filter by niche, location, followers and rate. Fashion, Beauty, Tech, Travel, Fitness creators and more.",
  openGraph: {
    title: "Browse Influencers | InfluMarket",
    description: "Discover verified influencers across India. Fashion, Beauty, Tech, Travel & more.",
    url: "https://influmarket.in/influencers",
  },
  alternates: { canonical: "https://influmarket.in/influencers" },
};

export default function InfluencersPage() {
  return <BrowseClient />;
}
