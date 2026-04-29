"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { InfluencerWithUser } from "@/types";

const NICHES = ["Fashion","Beauty","Tech","Food","Travel","Fitness","Lifestyle","Entertainment","Education","Business","Sports","Gaming","Other"];
const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","UAE","Singapore","Germany","France","Brazil"];

function formatFollowers(n: number) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`;
  return String(n);
}

function buildSocialUrl(platform: string, handle: string): string {
  if (!handle) return "";
  const h = handle.trim();
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  const clean = h.replace(/^@/, "");
  switch (platform) {
    case "youtube":   return `https://youtube.com/@${clean}`;
    case "instagram": return `https://instagram.com/${clean}`;
    case "tiktok":    return `https://tiktok.com/@${clean}`;
    case "twitter":   return `https://x.com/${clean}`;
    default:          return h;
  }
}

interface Filters {
  searchName: string;
  searchNiche: string;
  searchCountry: string;
  searchCity: string;
  minFollowers: string;
  maxRate: string;
}

const DEFAULT_FILTERS: Filters = {
  searchName: "",
  searchNiche: "",
  searchCountry: "",
  searchCity: "",
  minFollowers: "",
  maxRate: "",
};

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<InfluencerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const fetchInfluencers = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (f.searchNiche) q.append("niche", f.searchNiche);
      if (f.minFollowers) q.append("minFollowers", f.minFollowers);
      if (f.searchName.trim()) q.append("name", f.searchName.trim());

      const r = await fetch(`/api/influencers?${q}`);
      let data: InfluencerWithUser[] = await r.json();

      // Client-side filters for country, city, maxRate
      if (f.searchCountry) {
        data = data.filter((i: any) => {
          const country = (i.country || "").toLowerCase();
          const location = (i.location || "").toLowerCase();
          const search = f.searchCountry.toLowerCase();
          return country === search || location.includes(search);
        });
      }
      if (f.searchCity) {
        data = data.filter((i: any) => {
          const city = (i.city || "").toLowerCase();
          const location = (i.location || "").toLowerCase();
          const search = f.searchCity.toLowerCase().trim();
          return city.includes(search) || location.includes(search);
        });
      }
      if (f.maxRate) {
        data = data.filter((i: any) => i.ratePerPost <= Number(f.maxRate));
      }

      setInfluencers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfluencers(DEFAULT_FILTERS);
  }, [fetchInfluencers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInfluencers(filters);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    fetchInfluencers(DEFAULT_FILTERS);
  };

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Influencers</h1>
          <p className="text-gray-500">Discover verified creators across India and beyond</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.searchName}
                onChange={e => setFilter("searchName", e.target.value)}
                className="input-field col-span-2 lg:col-span-1"
              />
              <select
                value={filters.searchNiche}
                onChange={e => setFilter("searchNiche", e.target.value)}
                className="input-field"
              >
                <option value="">All Niches</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                value={filters.searchCountry}
                onChange={e => setFilter("searchCountry", e.target.value)}
                className="input-field"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="City..."
                value={filters.searchCity}
                onChange={e => setFilter("searchCity", e.target.value)}
                className="input-field"
              />
              <select
                value={filters.minFollowers}
                onChange={e => setFilter("minFollowers", e.target.value)}
                className="input-field"
              >
                <option value="">Any Followers</option>
                <option value="1000">1K+</option>
                <option value="10000">10K+</option>
                <option value="50000">50K+</option>
                <option value="100000">100K+</option>
                <option value="500000">500K+</option>
                <option value="1000000">1M+</option>
              </select>
              <select
                value={filters.maxRate}
                onChange={e => setFilter("maxRate", e.target.value)}
                className="input-field"
              >
                <option value="">Any Rate</option>
                <option value="1000">Up to ₹1K</option>
                <option value="5000">Up to ₹5K</option>
                <option value="10000">Up to ₹10K</option>
                <option value="25000">Up to ₹25K</option>
                <option value="50000">Up to ₹50K</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary px-8">Search</button>
              <button type="button" onClick={handleReset} className="px-5 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Reset</button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading influencers...</div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No influencers found</p>
            <p className="text-sm">Try different filters</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">{influencers.length} influencer{influencers.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {influencers.map(inf => {
                const totalFollowers =
                  ((inf as any).instagramFollowers || 0) +
                  ((inf as any).youtubeFollowers || 0) +
                  ((inf as any).tiktokFollowers || 0) +
                  ((inf as any).twitterFollowers || 0) +
                  ((inf as any).facebookFollowers || 0);

                return (
                  <div key={inf.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col" style={{height: "360px"}}>
                    {/* Top */}
                    <div className="p-5 flex flex-col items-center text-center border-b border-gray-50">
                      <div className="rounded-full mb-3 overflow-hidden bg-purple-100 flex items-center justify-center font-bold text-purple-600 flex-shrink-0" style={{width:72,height:72,fontSize:28}}>
                        {(inf as any).avatar
                          ? <img src={(inf as any).avatar} alt={inf.name} className="w-full h-full object-cover" />
                          : inf.name?.charAt(0)}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-1">{inf.name}</h3>
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{inf.niche}</span>
                      {((inf as any).city || (inf as any).country || inf.location) && (
                        <p className="text-xs text-gray-400 mt-1">
                          📍 {[(inf as any).city, (inf as any).country].filter(Boolean).join(", ") || inf.location}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="px-5 py-3 flex-1">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-500">Rate / Post</span>
                        <span className="font-bold text-purple-600">₹{inf.ratePerPost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Followers</span>
                        <span className="font-bold">{formatFollowers(totalFollowers)}</span>
                      </div>
                      {/* Social links */}
                      <div className="flex gap-1 flex-wrap">
                        {(inf as any).instagram && (
                          <a href={buildSocialUrl("instagram", (inf as any).instagram)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-full hover:bg-pink-100">
                            Instagram
                          </a>
                        )}
                        {(inf as any).youtube && (
                          <a href={buildSocialUrl("youtube", (inf as any).youtube)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full hover:bg-red-100">
                            YouTube
                          </a>
                        )}
                        {(inf as any).tiktok && (
                          <a href={buildSocialUrl("tiktok", (inf as any).tiktok)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full hover:bg-gray-100">
                            TikTok
                          </a>
                        )}
                        {(inf as any).twitter && (
                          <a href={buildSocialUrl("twitter", (inf as any).twitter)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full hover:bg-blue-100">
                            X/Twitter
                          </a>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-4">
                      <Link href={`/influencers/${inf.id}`} className="block w-full text-center btn-primary text-sm py-2 rounded-xl">
                        View Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
