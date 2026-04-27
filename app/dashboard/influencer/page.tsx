"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Deal = {
  id: string; title: string; description: string; dealValue: number;
  commission: number; status: string; createdAt: string;
  company?: { companyProfile?: { companyName?: string } };
};

type Message = {
  id: string; body: string; createdAt: string; senderId: string;
  sender: { influencerProfile?: { name?: string }; companyProfile?: { companyName?: string } };
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function InfluencerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  // Chat
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const msgBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user.role !== "INFLUENCER") router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") fetchDeals();
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

  const fetchMessages = async (dealId: string) => {
    const r = await fetch(`/api/deals/messages?dealId=${dealId}`);
    if (r.ok) setMessages(await r.json());
  };

  const handleDealUpdate = async (dealId: string, newStatus: string) => {
    const r = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
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
  const acceptedDeals = deals.filter(d => d.status === "ACCEPTED").length;
  const totalEarnings = deals.filter(d => d.status === "COMPLETED").reduce((s, d) => s + d.dealValue, 0);
  const filteredDeals = filter === "ALL" ? deals : deals.filter(d => d.status === filter);

  const getSenderName = (msg: Message) =>
    msg.sender.companyProfile?.companyName || msg.sender.influencerProfile?.name || "Unknown";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {session?.user.name}!</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card"><p className="text-gray-600 text-sm mb-2">Pending Proposals</p><p className="text-4xl font-bold text-primary-600">{pendingDeals}</p></div>
          <div className="card"><p className="text-gray-600 text-sm mb-2">Active Collaborations</p><p className="text-4xl font-bold text-primary-600">{acceptedDeals}</p></div>
          <div className="card"><p className="text-gray-600 text-sm mb-2">Total Earnings</p><p className="text-4xl font-bold text-primary-600">₹{totalEarnings.toLocaleString()}</p></div>
        </div>

        <div className="flex gap-6">
          {/* Deals section */}
          <div className="flex-1 min-w-0 bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <h2 className="text-2xl font-bold">Collaboration Proposals</h2>
              <div className="flex flex-wrap gap-2">
                {["ALL","PENDING","ACCEPTED","REJECTED","COMPLETED"].map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filter === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {filteredDeals.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No proposals yet</p>
            ) : (
              <div className="space-y-4">
                {filteredDeals.map(deal => (
                  <div key={deal.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900">{deal.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[deal.status] || "bg-gray-100 text-gray-700"}`}>
                            {deal.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          From: <span className="font-medium text-gray-700">{(deal as any).company?.companyProfile?.companyName || "Brand"}</span>
                        </p>
                        <div className="text-sm text-gray-600">
                          {expandedDeal === deal.id ? (
                            <>
                              <p>{deal.description}</p>
                              <button onClick={() => setExpandedDeal(null)} className="text-primary-600 text-xs mt-1 hover:underline">Show less</button>
                            </>
                          ) : (
                            <>
                              <p>{deal.description.length > 120 ? deal.description.slice(0, 120) + "…" : deal.description}</p>
                              {deal.description.length > 120 && (
                                <button onClick={() => setExpandedDeal(deal.id)} className="text-primary-600 text-xs mt-1 hover:underline">Read more</button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-primary-600">₹{deal.dealValue.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{new Date(deal.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {deal.status === "PENDING" && (
                        <>
                          <button onClick={() => handleDealUpdate(deal.id, "ACCEPTED")}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold">
                            ✓ Accept
                          </button>
                          <button onClick={() => handleDealUpdate(deal.id, "REJECTED")}
                            className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold">
                            ✗ Decline
                          </button>
                        </>
                      )}
                      <button onClick={() => setActiveDeal(activeDeal?.id === deal.id ? null : deal)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeDeal?.id === deal.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        💬 {activeDeal?.id === deal.id ? "Close Chat" : "Message"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat panel */}
          {activeDeal && (
            <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-lg flex flex-col" style={{height: "520px"}}>
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                <div>
                  <p className="font-semibold text-sm">{activeDeal.title}</p>
                  <p className="text-xs text-gray-400">{(activeDeal as any).company?.companyProfile?.companyName || "Brand"}</p>
                </div>
                <button onClick={() => setActiveDeal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && <p className="text-gray-400 text-xs text-center mt-8">No messages yet. Say hello!</p>}
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
      </div>
    </div>
  );
}
