"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NICHES = ["All","Fashion","Beauty","Tech","Gaming","Fitness","Food","Travel","Lifestyle","Business","Education"];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [filters, setFilters] = useState({ niche: "", minFollowers: "", maxRate: "" });

  const [socialSyncing, setSocialSyncing] = useState(false);
  const [socialResult, setSocialResult] = useState<any>(null);
  const [socialStatus, setSocialStatus] = useState<any>(null);
  const [socialLimit, setSocialLimit] = useState("50");

  const [stats, setStats] = useState<any>(null);
  const [pendingInfluencers, setPendingInfluencers] = useState<any[]>([]);
  const [allInfluencers, setAllInfluencers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sync"|"pending"|"manage">("sync");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/");
  }, [status, session]);

  useEffect(() => {
    fetchStats();
    fetchSocialStatus();
    fetchPending();
    fetchAllInfluencers();
  }, []);

  const fetchStats = async () => {
    try { const r = await fetch("/api/admin/stats"); if (r.ok) setStats(await r.json()); } catch {}
  };
  const fetchSocialStatus = async () => {
    try { const r = await fetch("/api/social/sync"); if (r.ok) setSocialStatus(await r.json()); } catch {}
  };
  const fetchPending = async () => {
    try { const r = await fetch("/api/admin/pending"); if (r.ok) setPendingInfluencers(await r.json()); } catch {}
  };
  const fetchAllInfluencers = async () => {
    try { const r = await fetch("/api/influencers?limit=200"); if (r.ok) setAllInfluencers(await r.json()); } catch {}
  };

  const handleApprove = async (userId: string, action: "APPROVED"|"REJECTED") => {
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: action }),
    });
    fetchPending();
    fetchStats();
    fetchAllInfluencers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this influencer?")) return;
    await fetch("/api/admin/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchAllInfluencers();
    fetchStats();
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const body: any = {};
      if (filters.niche && filters.niche !== "All") body.niche = filters.niche;
      if (filters.minFollowers) body.minFollowers = parseInt(filters.minFollowers);
      if (filters.maxRate) body.maxRate = parseInt(filters.maxRate);
      const r = await fetch("/api/youtube/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setSyncResult(await r.json());
      fetchStats();
    } catch { setSyncResult({ error: "Sync failed" }); }
    finally { setSyncing(false); }
  };

  const handleSocialSync = async () => {
    setSocialSyncing(true); setSocialResult(null);
    try {
      const r = await fetch("/api/social/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: parseInt(socialLimit) }) });
      setSocialResult(await r.json());
      fetchStats();
    } catch { setSocialResult({ error: "Social sync failed" }); }
    finally { setSocialSyncing(false); }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">⚙️ Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">Manage influencer data and platform settings</p>

        {/* Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">📊 Database Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Influencers</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{pendingInfluencers.length}</p>
                <p className="text-xs text-gray-600">Pending Approval</p>
              </div>
              {Object.entries(stats.byNiche).slice(0, 2).map(([n, c]) => (
                <div key={n} className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{c as number}</p>
                  <p className="text-xs text-gray-600">{n}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Nav */}
        <div className="flex gap-2 mb-6">
          {[["sync","🔄 Sync"],["pending","⏳ Pending Approvals"],["manage","🗂 Manage Influencers"]].map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === t ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 shadow"}`}>
              {l}{t === "pending" && pendingInfluencers.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">{pendingInfluencers.length}</span>}
            </button>
          ))}
        </div>

        {/* SYNC TAB */}
        {activeTab === "sync" && (
          <div className="space-y-6">
            {/* YouTube Sync */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">▶️ YouTube Influencer Sync</h2>
              <p className="text-gray-500 text-sm mb-4">Auto-fetch YouTube influencers from India across different niches.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={filters.niche} onChange={e => setFilters({...filters, niche: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                    {NICHES.map(n => <option key={n} value={n === "All" ? "" : n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Followers</label>
                  <input type="number" value={filters.minFollowers} onChange={e => setFilters({...filters, minFollowers: e.target.value})} placeholder="e.g. 10000" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Rate (₹)</label>
                  <input type="number" value={filters.maxRate} onChange={e => setFilters({...filters, maxRate: e.target.value})} placeholder="e.g. 50000" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <button onClick={handleSync} disabled={syncing} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60">
                {syncing ? <><span className="animate-spin">⟳</span> Syncing...</> : <>🔄 Sync YouTube Influencers</>}
              </button>
              {syncResult && (
                <div className={`mt-4 p-4 rounded-lg ${syncResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {syncResult.error ? <p>❌ {syncResult.error}</p> : <p className="font-semibold">✅ {syncResult.message}</p>}
                  {syncResult.errors?.length > 0 && <details className="mt-1 text-xs"><summary>Errors ({syncResult.errors.length})</summary><ul>{syncResult.errors.map((e:string,i:number)=><li key={i}>{e}</li>)}</ul></details>}
                </div>
              )}
            </div>

            {/* Social Sync */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-pink-500">
              <h2 className="text-lg font-semibold mb-1">📱 Instagram & Facebook Sync</h2>
              <p className="text-gray-500 text-sm mb-4">Sync follower counts for influencers with handles set.</p>
              {socialStatus && (
                <div className="flex gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${socialStatus.instagramConfigured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {socialStatus.instagramConfigured ? "✅" : "⚠️"} Instagram
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${socialStatus.facebookConfigured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {socialStatus.facebookConfigured ? "✅" : "⚠️"} Facebook
                  </span>
                </div>
              )}
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max to Sync</label>
                  <input type="number" value={socialLimit} onChange={e => setSocialLimit(e.target.value)} className="w-32 border rounded-lg px-3 py-2" />
                </div>
              </div>
              <button onClick={handleSocialSync} disabled={socialSyncing} className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60">
                {socialSyncing ? <><span className="animate-spin">⟳</span> Syncing...</> : <>📲 Sync Instagram & Facebook</>}
              </button>
              {socialResult && (
                <div className={`mt-4 p-4 rounded-lg ${socialResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {socialResult.error ? <p>❌ {socialResult.error}</p> : <p>✅ {socialResult.message}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-yellow-50">
              <h2 className="font-semibold text-yellow-800">⏳ Influencers Awaiting Approval ({pendingInfluencers.length})</h2>
            </div>
            {pendingInfluencers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No pending approvals 🎉</div>
            ) : (
              <div className="divide-y">
                {pendingInfluencers.map((inf: any) => (
                  <div key={inf.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg flex-shrink-0">
                      {inf.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{inf.name}</p>
                      <p className="text-sm text-gray-500">{inf.niche} • {inf.user?.email}</p>
                      {inf.phone && <p className="text-xs text-gray-400">📞 {inf.phone}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(inf.userId, "APPROVED")} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg">✓ Approve</button>
                      <button onClick={() => handleApprove(inf.userId, "REJECTED")} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1.5 rounded-lg">✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MANAGE TAB */}
        {activeTab === "manage" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">🗂 All Influencers ({allInfluencers.length})</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {allInfluencers.map((inf: any) => (
                <div key={inf.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {inf.avatar ? <img src={inf.avatar} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{inf.name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{inf.name}</p>
                    <p className="text-sm text-gray-500">{inf.niche}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${inf.status === "APPROVED" ? "bg-green-100 text-green-700" : inf.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {inf.status || "APPROVED"}
                  </span>
                  <button onClick={() => handleDelete(inf.userId)} className="text-red-500 hover:text-red-700 text-sm px-3 py-1.5 border border-red-200 hover:border-red-400 rounded-lg flex-shrink-0 transition-colors">
                    🗑 Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
