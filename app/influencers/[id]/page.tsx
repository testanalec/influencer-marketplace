"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { InfluencerProfile } from "@/types";

interface ProposalModal {
  isOpen: boolean;
  title: string;
  description: string;
  dealValue: string;
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
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
    case "facebook":  return `https://facebook.com/${clean}`;
    case "linkedin":  return `https://linkedin.com/in/${clean}`;
    default:          return h;
  }
}

export default function InfluencerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [influencer, setInfluencer] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposalModal, setProposalModal] = useState<ProposalModal>({
    isOpen: false,
    title: "",
    description: "",
    dealValue: "",
  });
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchInfluencer();
  }, [params.id]);

  const fetchInfluencer = async () => {
    try {
      const response = await fetch(`/api/influencers/${params.id}`);
      const data = await response.json();
      setInfluencer(data);
    } catch (err) {
      console.error("Failed to fetch influencer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProposalError("");
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "COMPANY") {
      setProposalError("Only brands can send proposals");
      return;
    }
    setProposalLoading(true);
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerId: influencer!.userId,
          title: proposalModal.title,
          description: proposalModal.description,
          dealValue: parseFloat(proposalModal.dealValue),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setProposalError(data.error || "Failed to send proposal");
        return;
      }
      setProposalModal({ isOpen: false, title: "", description: "", dealValue: "" });
      alert("Proposal sent successfully! The influencer has been notified by email.");
    } catch (err) {
      setProposalError("Failed to send proposal");
    } finally {
      setProposalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Influencer not found</p>
      </div>
    );
  }

  const totalFollowers =
    (influencer.instagramFollowers || 0) +
    (influencer.youtubeFollowers || 0) +
    (influencer.tiktokFollowers || 0) +
    (influencer.twitterFollowers || 0) +
    ((influencer as any).facebookFollowers || 0);

  const platforms = [
    {
      key: "youtube",
      label: "YouTube",
      icon: "▶️",
      handle: influencer.youtube,
      followers: influencer.youtubeFollowers,
      color: "#FF0000",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "📸",
      handle: influencer.instagram,
      followers: influencer.instagramFollowers,
      color: "#E1306C",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: "👤",
      handle: (influencer as any).facebook,
      followers: (influencer as any).facebookFollowers,
      color: "#1877F2",
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: "🎵",
      handle: influencer.tiktok,
      followers: influencer.tiktokFollowers,
      color: "#000000",
    },
    {
      key: "twitter",
      label: "Twitter / X",
      icon: "🐦",
      handle: influencer.twitter,
      followers: influencer.twitterFollowers,
      color: "#1DA1F2",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: "💼",
      handle: (influencer as any).linkedin,
      followers: null,
      color: "#0A66C2",
    },
  ]
    .filter((p) => p.handle)
    .map((p) => ({ ...p, url: buildSocialUrl(p.key, p.handle!) }));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Profile Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              {influencer.avatar && (
                <img
                  src={influencer.avatar}
                  alt={influencer.name}
                  className="w-40 h-40 rounded-full mb-4 object-cover"
                />
              )}
              <h1 className="text-3xl font-bold text-center">{influencer.name}</h1>
              <p className="text-primary-600 font-semibold mt-2">{influencer.niche}</p>
              {influencer.location && (
                <p className="text-gray-600 text-sm mt-1">📍 {influencer.location}</p>
              )}
            </div>

            {/* Info Cards */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="card">
                  <p className="text-gray-600 text-sm">Rate Per Post</p>
                  <p className="text-2xl font-bold text-primary-600">
                    ₹{influencer.ratePerPost.toLocaleString()}
                  </p>
                </div>
                <div className="card">
                  <p className="text-gray-600 text-sm">Total Followers</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatFollowers(totalFollowers)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-700">{influencer.bio}</p>
              </div>

              {/* Action Button */}
              {session?.user.role === "COMPANY" ? (
                <button
                  onClick={() => setProposalModal({ ...proposalModal, isOpen: true })}
                  className="btn-primary"
                >
                  Send Collaboration Proposal
                </button>
              ) : (
                <p className="text-gray-600 text-sm">
                  {session
                    ? "Only brands can send proposals"
                    : "Sign in as a brand to send proposals"}
                </p>
              )}
            </div>
          </div>

          {/* Social Media Section */}
          {platforms.length > 0 && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-6">Social Media Presence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <div key={platform.key} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <span>{platform.icon}</span>
                        {platform.label}
                      </h3>
                      {platform.followers && (
                        <span
                          className="text-sm font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: platform.color }}
                        >
                          {formatFollowers(platform.followers)} followers
                        </span>
                      )}
                    </div>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                    >
                      {platform.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Modal */}
      {proposalModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Send Proposal</h2>
            {proposalError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {proposalError}
              </div>
            )}
            <form onSubmit={handleProposalSubmit} className="space-y-4">
              <div>
                <label className="form-label">Proposal Title</label>
                <input
                  type="text"
                  value={proposalModal.title}
                  onChange={(e) =>
                    setProposalModal({ ...proposalModal, title: e.target.value })
                  }
                  required
                  className="input-field"
                  placeholder="e.g., Summer Campaign"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={proposalModal.description}
                  onChange={(e) =>
                    setProposalModal({ ...proposalModal, description: e.target.value })
                  }
                  required
                  className="input-field"
                  rows={3}
                  placeholder="Describe your campaign..."
                />
              </div>
              <div>
                <label className="form-label">Deal Value (₹)</label>
                <input
                  type="number"
                  value={proposalModal.dealValue}
                  onChange={(e) =>
                    setProposalModal({ ...proposalModal, dealValue: e.target.value })
                  }
                  required
                  className="input-field"
                  placeholder="50000"
                  step="1000"
                  min="0"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setProposalModal({ isOpen: false, title: "", description: "", dealValue: "" })
                  }
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={proposalLoading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {proposalLoading ? "Sending..." : "Send Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
    }
