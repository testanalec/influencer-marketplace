"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InfluencerCard } from "@/components/InfluencerCard";
import { InfluencerWithUser } from "@/types";

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<InfluencerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNiche, setSearchNiche] = useState("");
  const [minFollowers, setMinFollowers] = useState("");

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchNiche) queryParams.append("niche", searchNiche);
      if (minFollowers) queryParams.append("minFollowers", minFollowers);

      const response = await fetch(
        `/api/influencers?${queryParams.toString()}`
      );
      const data = await response.json();
      setInfluencers(data);
    } catch (err) {
      console.error("Failed to fetch influencers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInfluencers();
  };

  const niches = [
    "Fashion",
    "Beauty",
    "Tech",
    "Food",
    "Travel",
    "Fitness",
    "Lifestyle",
    "Entertainment",
    "Education",
    "Business",
    "Sports",
    "Gaming",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Browse Influencers</h1>
          <p className="text-gray-600 text-lg">
            Discover amazing creators across different niches
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Niche</label>
                <select
                  value={searchNiche}
                  onChange={(e) => setSearchNiche(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Niches</option>
                  {niches.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Min Followers</label>
                <select
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any</option>
                  <option value="10000">10K+</option>
                  <option value="50000">50K+</option>
                  <option value="100000">100K+</option>
                  <option value="500000">500K+</option>
                  <option value="1000000">1M+</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading influencers...</p>
          </div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No influencers found</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Found {influencers.length} influencer{influencers.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers.map((influencer) => (
                <Link key={influencer.id} href={`/influencers/${influencer.id}`}>
                  <InfluencerCard influencer={influencer} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
