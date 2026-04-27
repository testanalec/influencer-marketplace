"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Influencer = {
  id: string; userId: string; name: string; bio: string; niche: string;
  status: string; ratePerPost: number; location?: string; avatar?: string;
  instagram?: string; youtube?: string; instagramFollowers?: number;
  youtubeFollowers?: number;
};

type Deal = {
  id: string; title: string; description: string; dealValue: number;
  commission: number; status: string; createdAt: string;
  influencer?: { influencerProfile?: { name?: string } };
};

type Message = {
  id: string; body: string; createdAt: string; senderId: string;
  sender: { influencerProfile?: { name?: string }; companyProfile?: { companyName?: string } };
};

const NICHES = ["", "Fashion","Beauty","Tech","Gaming","Fitness","Food","Travel","Lifestyle","Business","Education","Entertainment","Sports","Other"];

export default function CompanyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"search"|"deals">("search");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNiche, setSearchNiche] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Chat
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const msgBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user.role !== "COMPANY") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDeals();
      fetchInfluencers("", "");
    }
  }, [status]);

  useEffect(() => {
    if (activeDeal) fetchMessages(activeDeal.id);
  }, [activeDeal]);

  useEffect(() => {
    msgBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDeals = async () => {
    try {
      const r = await fetch("/api/deals");
      const data = await r.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch { setDeals([]); } finally { setLoading(false); }
  };

  const fetchInfluencers = async (niche: string, name: string) => {
    setSearchLoading(true);
    try {
      const q = new URLSearchParams();
      if (niche) q.append("niche", niche);
      if (name) q.append("name", name);
      const r = await fetch(`/api/influencers?${q}`);
      const data = await r.json();
      setInfluencers(Array.isArray(data) ? data : []);
    } catch { setInfluencers([]); } finally { setSearchLoading(false); }
  };

  const fetchMessages = async (dealId: string) => {
    const r = await fetch(`/api/deals/messages?dealId=${dealId}`);
    if (r.ok) setMessages(await r.json());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInfluencers(searchNiche, searchName);
  };

  const handleComplete = async (dealId: string) => {
    if (!confirm("Mark this deal as completed? This confirms the influencer has delivered the work.")) return;
    const r = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (r.ok) fetchDeals();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeDeal) return;
    setMsgLoading(true);
    const r = await fetch("/api/deals/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: activeDeal.id, body: msgInput }),
    });
    if (r.ok) {
      const msg = await r.json();
      setMessages(prev => [...prev, msg]);
      setMsgInput("");
    }
    setMsgLoading(false);
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>;
  }

  const pendingDeals = deals.filter(d => d.status === "PENDING").length;
  const activeDeals = deals.filter(d => d.status === "ACCEPTED").length;
  const totalSpent = deals.filter(d => d.status === "COMPLETED").reduce((s, d) => s + d.dealValue, 0);

  const getSenderName = (msg: Message) =>
    msg.sender.companyProfile?.companyName || msg.sender.influencerProfile?.name || "Unknown";

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ACCEPTED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    COMPLETED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {session?.user.name}!</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card"><p className="text-gray-600 text-sm mb-2">Pending Proposals</p><p className="text-4xl font-bold text-primary-600">{pendingDeals}</p></div>
          <div className="card"><p className="text-gray-600 text-sm mb-2">Active Collaborations</p><p className="text-4xl font-bold text-primary-600">{activeDeals}</p></div>
          <div className="card"><p className="text-gray-600 text-sm mb-2">Total Investment</p><p className="text-4xl font-bold text-primary-600">₹{totalSpent.toLocaleString()}</p></div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {["search","deals"].map(t => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${tab === t ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {t === "search" ? "Find Influencers" : `My Proposals${deals.length > 0 ? ` (${deals.length})` : ""}`}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "search" && (
              <div>
                <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
                  <input
                    type="text" placeholder="Search by name..."
                    value={searchName} onChange={e => setSearchName(e.target.value)}
                    className="input-field flex-1 min-w-[180px]"
                  />
                  <select value={searchNiche} onChange={e => setSearchNiche(e.target.value)} className="input-field w-44">
                    <option value="">All Niches</option>
                    {NICHES.filter(Boolean).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button type="submit" className="btn-primary px-8">Search</button>
                </form>

                {searchLoading ? (
                  <div className="text-center py-12 text-gray-500">Searching...</div>
                ) : influencers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">No influencers found. Try a different search.</div>
                ) : (
                  <>
                    <p className="text-gray-500 text-sm mb-4">{influencers.length} influencer{influencers.length !== 1 ? "s" : ""} found</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {influencers.map(inf => (
                        <div key={inf.id} className="card hover:shadow-md transition-shadow">
                          {inf.avatar && <img src={inf.avatar} alt={inf.name} className="w-16 h-16 rounded-full mb-3 object-cover"/>}
                          <h3 className="text-lg font-bold mb-1">{inf.name}</h3>
                          <p className="text-primary-600 text-sm mb-1">{inf.niche}</p>
                          {inf.location && <p className="text-gray-400 text-xs mb-2">📍 {inf.location}</p>}
                          {inf.instagramFollowers ? <p className="text-pink-600 text-sm mb-1">📸 {(inf.instagramFollowers/1000).toFixed(0)}K Instagram</p> : null}
                          {inf.youtubeFollowers ? <p className="text-red-600 text-sm mb-1">▶ {(inf.youtubeFollowers/1000).toFixed(0)}K YouTube</p> : null}
                          <p className="text-gray-700 font-semibold mb-3 mt-1">₹{inf.ratePerPost.toLocaleString()} / post</p>
                          <a href={`/influencers/${inf.id}`} className="btn-primary text-sm inline-block">View & Propose</a>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "deals" && (
              <div className="flex gap-6">
                {/* Deals list */}
                <div className="flex-1 min-w-0">
                  {deals.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 mb-3">No proposals sent yet.</p>
                      <button onClick={() => setTab("search")} className="btn-primary text-sm">Find Influencers</button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="py-3 px-3 font-medium">Campaign</th>
                            <th className="py-3 px-3 font-medium">Influencer</th>
                            <th className="py-3 px-3 font-medium">Value</th>
                            <th className="py-3 px-3 font-medium">Platform Fee</th>
                            <th className="py-3 px-3 font-medium">Status</th>
                            <th className="py-3 px-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deals.map(deal => (
                            <tr key={deal.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-3">
                                <div className="font-semibold">{deal.title}</div>
                                <div className="text-gray-400 text-xs mt-0.5 max-w-[180px] truncate" title={deal.description}>{deal.description}</div>
                              </td>
                              <td className="py-3 px-3 text-gray-600">{(deal as any).influencer?.influencerProfile?.name || "—"}</td>
                              <td className="py-3 px-3 font-semibold text-primary-600">₹{deal.dealValue.toLocaleString()}</td>
                              <td className="py-3 px-3 text-gray-500">₹{deal.commission.toLocaleString()}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[deal.status] || "bg-gray-100 text-gray-700"}`}>
                                  {deal.status}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex gap-2">
                                  <button onClick={() => { setActiveDeal(deal); setTab("deals"); }}
                                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
                                    💬 Chat
                                  </button>
                                  {deal.status === "ACCEPTED" && (
                                    <button onClick={() => handleComplete(deal.id)}
                                      className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-semibold">
                                      ✓ Complete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Chat panel */}
                {activeDeal && (
                  <div className="w-80 flex-shrink-0 border border-gray-200 rounded-lg flex flex-col" style={{height: "480px"}}>
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                      <div>
                        <p className="font-semibold text-sm">{activeDeal.title}</p>
                        <p className="text-xs text-gray-400">{(activeDeal as any).influencer?.influencerProfile?.name}</p>
                      </div>
                      <button onClick={() => setActiveDeal(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {messages.length === 0 && <p className="text-gray-400 text-xs text-center mt-8">No messages yet. Start the conversation!</p>}
                      {messages.map(msg => {
                        const isMe = msg.senderId === session?.user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isMe ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                              {!isMe && <p className="text-xs font-semibold mb-0.5 opacity-70">{getSenderName(msg)}</p>}
                              <p>{msg.body}</p>
                              <p className={`text-xs mt-0.5 ${isMe ? "opacity-60" : "text-gray-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={msgBottomRef}/>
                    </div>
                    <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
                      <input type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                        placeholder="Type a message..." className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                      <button type="submit" disabled={msgLoading || !msgInput.trim()}
                        className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700">
                        Send
                      </button>
                    </form>
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
