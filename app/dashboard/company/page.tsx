"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Deal, InfluencerWithUser } from "@/types";

export default function CompanyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerWithUser[]>([]);
  const [searchNiche, setSearchNiche] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("search");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "COMPANY") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDeals();
    }
  }, [status]);

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals");
      const data = await response.json();
      setDeals(data);
    } catch (err) {
      console.error("Failed to fetch deals:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchInfluencers = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const queryParams = new URLSearchParams();
      if (searchNiche) queryParams.append("niche", searchNiche);
      const response = await fetch(`/api/influencers?${queryParams.toString()}`);
      const data = await response.json();
      setInfluencers(data);
    } catch (err) {
      console.error("Failed to search influencers:", err);
    }
  };

  const syncYouTubeInfluencers = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/youtube/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setSyncMessage({ type: "error", text: data.error || "Sync failed" });
      } else {
        setSyncMessage({
          type: "success",
          text: data.message || `Synced ${data.totalSynced} YouTube influencers successfully!`,
        });
        // Refresh influencer list after sync
        const res = await fetch("/api/influencers");
        const updated = await res.json();
        setInfluencers(updated);
      }
    } catch (err) {
      setSyncMessage({ type: "error", text: "Failed to connect to sync service" });
    } finally {
      setSyncing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const pendingDeals = deals.filter((d) => d.status === "PENDING").length;
  const acceptedDeals = deals.filter((d) => d.status === "ACCEPTED").length;
  const totalSpent = deals
    .filter((d) => d.status === "COMPLETED")
    .reduce((sum, d) => sum + d.dealValue, 0);

  const niches = [
    "Fashion", "Beauty", "Tech", "Food", "Travel", "Fitness",
    "Lifestyle", "Entertainment", "Education", "Business", "Sports", "Gaming",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {session?.user.name}!</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 text-sm mb-2">Pending Proposals</p>
            <p className="text-4xl font-bold text-primary-600">{pendingDeals}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm mb-2">Active Collaborations</p>
            <p className="text-4xl font-bold text-primary-600">{acceptedDeals}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm mb-2">Total Investment</p>
            <p className="text-4xl font-bold text-primary-600">
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* YouTube Sync Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-red-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-red-600">▶</span> YouTube Influencer Sync
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Auto-fetch and list YouTube influencers from Fashion, Beauty, Tech, Gaming, Fitness, Food &amp; Travel niches
              </p>
            </div>
            <button
              onClick={syncYouTubeInfluencers}
              disabled={syncing}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Syncing YouTube...
                </>
              ) : (
                "🔄 Sync YouTube Influencers"
              )}
            </button>
          </div>
          {syncMessage && (
            <div
              className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
                syncMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {syncMessage.type === "success" ? "✅ " : "❌ "}{syncMessage.text}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setTab("search")}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                tab === "search"
                  ? "bg-primary-600 text-white border-b-4 border-primary-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Search Influencers
            </button>
            <button
              onClick={() => setTab("deals")}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                tab === "deals"
                  ? "bg-primary-600 text-white border-b-4 border-primary-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              My Proposals
            </button>
          </div>

          <div className="p-6">
            {tab === "search" ? (
              <div>
                <h2 className="text-2xl font-bold mb-6">Find Influencers</h2>
                <form onSubmit={searchInfluencers} className="mb-8">
                  <div className="flex gap-4">
                    <select
                      value={searchNiche}
                      onChange={(e) => setSearchNiche(e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="">All Niches</option>
                      {niches.map((niche) => (
                        <option key={niche} value={niche}>{niche}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn-primary px-8">Search</button>
                  </div>
                </form>
                {influencers.length > 0 && (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Found {influencers.length} influencer{influencers.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {influencers.map((influencer) => (
                        <div key={influencer.id} className="card">
                          {influencer.avatar && (
                            <img
                              src={influencer.avatar}
                              alt={influencer.name}
                              className="w-20 h-20 rounded-full mb-4 object-cover"
                            />
                          )}
                          <h3 className="text-lg font-bold mb-1">{influencer.name}</h3>
                          <p className="text-primary-600 text-sm mb-1">{influencer.niche}</p>
                          {influencer.location && (
                            <p className="text-gray-500 text-xs mb-2">📍 {influencer.location}</p>
                          )}
                          {influencer.youtubeFollowers ? (
                            <p className="text-red-600 text-sm font-semibold mb-2">
                              ▶ {(influencer.youtubeFollowers / 1000).toFixed(0)}K YouTube subscribers
                            </p>
                          ) : null}
                          <p className="text-gray-600 text-sm mb-4">
                            ₹{influencer.ratePerPost.toLocaleString()} per post
                          </p>
                          <a href={`/influencers/${influencer.id}`} className="inline-block btn-primary text-sm">
                            View Profile
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Proposals</h2>
                {deals.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No proposals sent yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Title</th>
                          <th className="text-left py-3 px-4">Influencer</th>
                          <th className="text-left py-3 px-4">Deal Value</th>
                          <th className="text-left py-3 px-4">Commission</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deals.map((deal) => (
                          <tr key={deal.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-4 font-semibold">{deal.title}</td>
                            <td className="py-4 px-4 text-gray-600">Influencer</td>
                            <td className="py-4 px-4 font-semibold text-primary-600">
                              ₹{deal.dealValue.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-red-600">
                              ₹{deal.commission.toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                deal.status === "PENDING" ? "bg-yellow-100 text-yellow-700"
                                : deal.status === "ACCEPTED" ? "bg-green-100 text-green-700"
                                : deal.status === "REJECTED" ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                              }`}>
                                {deal.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
                }
