"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NICHES = ["All","Fashion","Beauty","Tech","Gaming","Fitness","Food","Travel","Lifestyle","Business","Education"];
const STATUS_OPTIONS = ["All","APPROVED","PENDING","REJECTED"];

type SortKey = "name"|"niche"|"followers"|"rate"|"createdAt";

function SortBtn({ col, label, sortBy, setSortBy, setSortDir, sortDir }: {
  col: SortKey; label: string;
  sortBy: SortKey; sortDir: "asc"|"desc";
  setSortBy: React.Dispatch<React.SetStateAction<SortKey>>;
  setSortDir: React.Dispatch<React.SetStateAction<"asc"|"desc">>;
}) {
  const handleClick = () => {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 hover:text-purple-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
    >
      {label} {sortBy === col ? (sortDir === "asc" ? " (asc)" : " (desc)") : ""}
    </button>
  );
}

type Influencer = {
  id: string; userId: string; name: string; bio: string; niche: string;
  status: string; phone?: string; instagram?: string; youtube?: string;
  tiktok?: string; twitter?: string; facebook?: string; linkedin?: string;
  instagramFollowers?: number; youtubeFollowers?: number; tiktokFollowers?: number;
  twitterFollowers?: number; facebookFollowers?: number; ratePerPost: number;
  location?: string; avatar?: string; createdAt: string;
  user?: { email: string; id: string };
};

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview"|"influencers"|"brands"|"deals"|"sync"|"create">("overview");
  // Create user form
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "INFLUENCER" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<{ error?: string; message?: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Influencer table filters
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [socialSyncing, setSocialSyncing] = useState(false);
  const [socialResult, setSocialResult] = useState<any>(null);
  const [syncFilters, setSyncFilters] = useState({ niche: "", minFollowers: "", maxRate: "" });
  const [socialLimit, setSocialLimit] = useState("50");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/");
  }, [status, session]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsR, infR, compR, dealsR] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/influencers?limit=2000&includeAll=true"),
        fetch("/api/admin/companies"),
        fetch("/api/admin/deals"),
      ]);
      if (statsR.ok) setStats(await statsR.json());
      if (infR.ok) setInfluencers(await infR.json());
      if (compR.ok) setCompanies(await compR.json());
      if (dealsR.ok) setDeals(await dealsR.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (status === "authenticated") fetchAll(); }, [status]);

  const handleApprove = async (userId: string, action: "APPROVED" | "REJECTED") => {
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: action }),
    });
    fetchAll();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this influencer permanently?")) return;
    await fetch("/api/admin/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchAll();
  };

  const handleBulkAction = async (action: "APPROVED" | "REJECTED" | "DELETE") => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${action === "DELETE" ? "Delete" : action === "APPROVED" ? "Approve" : "Reject"} ${selectedIds.size} influencer(s)?`)) return;
    const ids = Array.from(selectedIds);
    for (const userId of ids) {
      if (action === "DELETE") {
        await fetch("/api/admin/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      } else {
        await fetch("/api/admin/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, status: action }) });
      }
    }
    setSelectedIds(new Set());
    fetchAll();
  };

  const handleExport = () => {
    const filtered = getFilteredInfluencers();
    const headers = ["Name","Email","Phone","Niche","Status","Instagram","YouTube","TikTok","Twitter","Facebook","IG Followers","YT Followers","TT Followers","TW Followers","FB Followers","Rate Per Post (₹)","Location","Bio","Joined Date"];
    const rows = filtered.map(inf => [
      inf.name, inf.user?.email || "", inf.phone || "", inf.niche, inf.status,
      inf.instagram || "", inf.youtube || "", inf.tiktok || "", inf.twitter || "", inf.facebook || "",
      inf.instagramFollowers || 0, inf.youtubeFollowers || 0, inf.tiktokFollowers || 0,
      inf.twitterFollowers || 0, inf.facebookFollowers || 0,
      inf.ratePerPost, inf.location || "", `"${(inf.bio || "").replace(/"/g, '""')}"`,
      new Date(inf.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influencers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredInfluencers = () => {
    return influencers
      .filter(inf => {
        const q = search.toLowerCase();
        const matchSearch = !q || inf.name?.toLowerCase().includes(q) || inf.user?.email?.toLowerCase().includes(q) || inf.niche?.toLowerCase().includes(q);
        const matchNiche = nicheFilter === "All" || inf.niche === nicheFilter;
        const matchStatus = statusFilter === "All" || inf.status === statusFilter;
        return matchSearch && matchNiche && matchStatus;
      })
      .sort((a, b) => {
        let va: any, vb: any;
        if (sortBy === "followers") {
          va = (a.instagramFollowers||0)+(a.youtubeFollowers||0)+(a.tiktokFollowers||0);
          vb = (b.instagramFollowers||0)+(b.youtubeFollowers||0)+(b.tiktokFollowers||0);
        } else if (sortBy === "rate") { va = a.ratePerPost; vb = b.ratePerPost; }
        else if (sortBy === "createdAt") { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
        else { va = ((a as any)[sortBy] || "").toLowerCase(); vb = ((b as any)[sortBy] || "").toLowerCase(); }
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const body: any = {};
      if (syncFilters.niche && syncFilters.niche !== "All") body.niche = syncFilters.niche;
      if (syncFilters.minFollowers) body.minFollowers = parseInt(syncFilters.minFollowers);
      if (syncFilters.maxRate) body.maxRate = parseInt(syncFilters.maxRate);
      const r = await fetch("/api/youtube/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setSyncResult(await r.json());
      fetchAll();
    } catch { setSyncResult({ error: "Sync failed" }); }
    finally { setSyncing(false); }
  };

  const handleSocialSync = async () => {
    setSocialSyncing(true); setSocialResult(null);
    try {
      const r = await fetch("/api/social/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: parseInt(socialLimit) }) });
      setSocialResult(await r.json());
      fetchAll();
    } catch { setSocialResult({ error: "Social sync failed" }); }
    finally { setSocialSyncing(false); }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (session?.user?.role !== "ADMIN") return null;

  const filtered = getFilteredInfluencers();
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pending = influencers.filter(i => i.status === "PENDING");
  const approved = influencers.filter(i => i.status === "APPROVED");
  const totalFollowers = influencers.reduce((s, i) => s + (i.instagramFollowers||0) + (i.youtubeFollowers||0) + (i.tiktokFollowers||0), 0);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "influencers", label: "Influencers", icon: "👥", badge: pending.length > 0 ? pending.length : undefined },
    { id: "brands", label: "Brands", icon: "🏢" },
    { id: "deals", label: "Deals", icon: "🤝" },
    { id: "sync", label: "Sync", icon: "🔄" },
    { id: "create", label: "Create User", icon: "➕" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-5 border-b">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Admin</p>
          <p className="font-bold text-gray-900 truncate">{session?.user?.name || "Admin"}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              <span className="flex items-center gap-2">{tab.icon} {tab.label}</span>
              {tab.badge && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{tab.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <a href="/" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">← Back to site</a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Overview</h1>
              <p className="text-gray-500 text-sm mb-6">Platform health at a glance</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Influencers" value={influencers.length} icon="👥" color="bg-purple-100" />
                <StatCard label="Approved" value={approved.length} icon="✅" color="bg-green-100" />
                <StatCard label="Pending Approval" value={pending.length} icon="⏳" color="bg-yellow-100" />
                <StatCard label="Total Brands" value={companies.length} icon="🏢" color="bg-blue-100" />
                <StatCard label="Total Deals" value={deals.length} icon="🤝" color="bg-pink-100" />
                <StatCard label="Total Followers" value={totalFollowers >= 1000000 ? `${(totalFollowers/1000000).toFixed(1)}M` : `${(totalFollowers/1000).toFixed(0)}K`} icon="📱" color="bg-orange-100" />
                <StatCard label="Active Deals" value={deals.filter(d=>d.status==="ACCEPTED").length} icon="🚀" color="bg-indigo-100" />
                <StatCard label="Completed Deals" value={deals.filter(d=>d.status==="COMPLETED").length} icon="🏆" color="bg-emerald-100" />
              </div>

              {/* Niche breakdown */}
              {stats?.byNiche && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                  <h2 className="font-bold text-gray-900 mb-4">Influencers by Niche</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                             {Object.entries(stats.byNiche).sort((a,b) => (b[1] as number)-(a[1] as number)).map(([niche, count]) => (
                      <div key={niche} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-purple-600">{count as number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{niche}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending quick actions */}
              {pending.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">⏳ Pending Approvals ({pending.length})</h2>
                    <button onClick={() => setActiveTab("influencers")} className="text-sm text-purple-600 hover:underline">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {pending.slice(0,5).map(inf => (
                      <div key={inf.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                          {inf.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{inf.name}</p>
                          <p className="text-xs text-gray-500">{inf.niche} · {inf.user?.email}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleApprove(inf.userId, "APPROVED")} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">Approve</button>
                          <button onClick={() => handleApprove(inf.userId, "REJECTED")} className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-200">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INFLUENCERS TAB */}
          {activeTab === "influencers" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Influencers</h1>
                  <p className="text-gray-500 text-sm">{filtered.length} results</p>
                </div>
                <div className="flex gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <button onClick={() => handleBulkAction("APPROVED")} className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700">✓ Approve ({selectedIds.size})</button>
                      <button onClick={() => handleBulkAction("REJECTED")} className="bg-yellow-500 text-white text-sm px-3 py-2 rounded-lg hover:bg-yellow-600">✗ Reject ({selectedIds.size})</button>
                      <button onClick={() => handleBulkAction("DELETE")} className="bg-red-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-700">🗑 Delete ({selectedIds.size})</button>
                    </>
                  )}
                  <button onClick={handleExport} className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                    ⬇ Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
                <input type="text" placeholder="Search name, email, niche…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <select value={nicheFilter} onChange={e => { setNicheFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {NICHES.map(n => <option key={n}>{n}</option>)}
                </select>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                y(search || nicheFilter !== "All" || statusFilter !== "All") && (
                  <button onClick={() => { setSearch(""); setNicheFilter("All"); setStatusFilter("All"); setPage(1); }} className="text-sm text-gray-500 hover:text-gray-700 px-2">✕ Clear</button>
                )}
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left w-10">
                          <input type="checkbox" className="rounded"
                            checked={selectedIds.size === paginated.length && paginated.length > 0}
                            onChange={e => {
                              if (e.target.checked) setSelectedIds(new Set(paginated.map(i => i.userId)));
                              else setSelectedIds(new Set());
                            }} />
                        </th>
                        <th className="py-3 px-4 text-left"><SortBtn col="name" label="Name" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} /></th>
                        <th className="py-3 px-4 text-left"><SortBtn col="niche" label="Niche" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} /></th>
                        <th className="py-3 px-4 text-left text-xs uppercase tracking-wide font-semibold text-gray-500">Status</th>
                        <th className="py-3 px-4 text-left"><SortBtn col="followers" label="Followers" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} /></th>
                        <th className="py-3 px-4 text-left"><SortBtn col="rate" label="Rate/Post" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} /></th>
                        <th className="py-3 px-4 text-left text-xs uppercase tracking-wide font-semibold text-gray-500">Platforms</th>
                        <th className="py-3 px-4 text-left"><SortBtn col="createdAt" label="Joined" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} /></th>
                        <th className="py-3 px-4 text-left text-xs uppercase tracking-wide font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginated.length === 0 ? (
                        <tr><td colSpan={9} className="py-12 text-center text-gray-400">No influencers found</td></tr>
                      ) : paginated.map(inf => {
                        const totalF = (inf.instagramFollowers||0)+(inf.youtubeFollowers||0)+(inf.tiktokFollowers||0)+(inf.twitterFollowers||0);
                        return (
                          <tr key={inf.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(inf.userId) ? "bg-purple-50" : ""}`}>
                            <td className="py-3 px-4">
                              <input type="checkbox" className="rounded" checked={selectedIds.has(inf.userId)}
                                onChange={e => {
                                  const s = new Set(selectedIds);
                                  if (e.target.checked) s.add(inf.userId); else s.delete(inf.userId);
                                  setSelectedIds(s);
                                }} />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0 overflow-hidden">
                                  {inf.avatar ? <img src={inf.avatar} className="w-full h-full object-cover" alt="" /> : inf.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{inf.name}</p>
                                  <p className="text-xs text-gray-400">{inf.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{inf.niche}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${inf.status === "APPROVED" ? "bg-green-100 text-green-700" : inf.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {inf.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-medium">
                              {totalF >= 1000000 ? `${(totalF/1000000).toFixed(1)}M` : totalF >= 1000 ? `${(totalF/1000).toFixed(0)}K` : totalF || "—"}
                            </td>
                            <td className="py-3 px-4 text-gray-600">₹{inf.ratePerPost?.toLocaleString() || "—"}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                {inf.instagram && <span title={`@${inf.instagram}`} className="text-pink-500 text-sm">📸</span>}
                                {inf.youtube && <span title={inf.youtube} className="text-red-500 text-sm">▶️</span>}
                                {inf.tiktok && <span title={`@${inf.tiktok}`} className="text-gray-700 text-sm">🎵</span>}
                                {inf.twitter && <span title={`@${inf.twitter}`} className="text-blue-400 text-sm">𝕏</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-xs">{new Date(inf.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                {inf.status !== "APPROVED" && (
                                  <button onClick={() => handleApprove(inf.userId, "APPROVED")} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200" title="Approve">✓</button>
                                )}
                                {inf.status !== "REJECTED" && (
                                  <button onClick={() => handleApprove(inf.userId, "REJECTED")} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200" title="Reject">✗</button>
                                )}
                                <button onClick={() => handleDelete(inf.userId)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200" title="Delete">🗑</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
                    <p className="text-sm text-gray-500">Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">← Prev</button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                        return <button key={p} onClick={() => setPage(p)} className={`text-sm w-8 h-8 rounded-lg ${page === p ? "bg-purple-600 text-white" : "border hover:bg-gray-100"}`}>{p}</button>;
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRANDS TAB */}
          {activeTab === "brands" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-5">Brands</h1>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Company</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Email</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Industry</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Phone</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Website</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-gray-400">No brands registered yet</td></tr>
                    ) : companies.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{c.companyName}</p>
                          {c.description && <p className="text-xs text-gray-400 truncate max-w-xs">{c.description}</p>}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{c.user?.email}</td>
                        <td className="py-3 px-4 text-gray-600">{c.industry}</td>
                        <td className="py-3 px-4 text-gray-400">{c.phone || "—"}</td>
                        <td className="py-3 px-4">{c.website ? <a href={c.website} target="_blank" className="text-purple-600 hover:underline text-xs">{c.website.replace("https://", "").replace("http://", "")}</a> : "—"}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEALS TAB */}
          {activeTab === "deals" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-5">All Deals</h1>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {["PENDING","ACCEPTED","REJECTED","COMPLETED"].map(s => (
                  <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{deals.filter(d=>d.status===s).length}</p>
                    <p className="text-sm text-gray-500 mt-1">{s}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Campaign</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Value</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Commission</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Status</th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-500 text-xs uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deals.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400">No deals yet</td></tr>
                    ) : deals.map((d: any) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{d.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{d.description}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-purple-600">₹{d.dealValue?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-red-500">₹{d.commission?.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.status==="ACCEPTED"?"bg-green-100 text-green-700":d.status==="REJECTED"?"bg-red-100 text-red-700":d.status==="COMPLETED"?"bg-blue-100 text-blue-700":"bg-yellow-100 text-yellow-700"}`}>{d.status}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYNC TAB */}
          {activeTab === "create" && (
            <div className="max-w-xl">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h1>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-6">Create an account for any role — Admin, Influencer, Brand, or basic user. The user can log in immediately with the credentials you set.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name / Company Name</label>
                    <input type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})}
                      placeholder="e.g. Rahul Mittal" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})}
                      placeholder="user@example.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})}
                      placeholder="Min 8 characters" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                    <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                      <option value="INFLUENCER">Influencer — Can receive brand proposals</option>
                      <option value="COMPANY">Brand — Can search &amp; send proposals</option>
                      <option value="ADMIN">Admin — Full platform access</option>
                      <option value="PENDING_ONBOARDING">Basic User — Must complete onboarding</option>
                    </select>
                  </div>
                  {createResult && (
                    <div className={`p-3 rounded-lg text-sm ${createResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {createResult.error || createResult.message}
                    </div>
                  )}
                  <button
                    disabled={createLoading || !createForm.email || !createForm.password || !createForm.name}
                    onClick={async () => {
                      setCreateLoading(true); setCreateResult(null);
                      try {
                        const r = await fetch("/api/admin/create", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(createForm),
                        });
                        const data = await r.json();
                        if (r.ok) {
                          setCreateResult({ message: `User created successfully! They can log in at influmarket.in/login` });
                          setCreateForm({ name: "", email: "", password: "", role: "INFLUENCER" });
                          fetchAll();
                        } else {
                          setCreateResult({ error: data.error || "Failed to create user" });
                        }
                      } catch { setCreateResult({ error: "Network error" }); }
                      finally { setCreateLoading(false); }
                    }}
                    className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm">
                    {createLoading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sync" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Data Sync</h1>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">▶️</div>
                  <div><h2 className="font-bold text-gray-900">YouTube Influencer Sync</h2><p className="text-sm text-gray-500">Auto-fetch Indian YouTube influencers by niche</p></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select value={syncFilters.niche} onChange={e => setSyncFilters({...syncFilters, niche: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {NICHES.map(n => <option key={n} value={n === "All" ? "" : n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Followers</label>
                    <input type="number" value={syncFilters.minFollowers} onChange={e => setSyncFilters({...syncFilters, minFollowers: e.target.value})} placeholder="10000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Rate (₹)</label>
                    <input type="number" value={syncFilters.maxRate} onChange={e => setSyncFilters({...syncFilters, maxRate: e.target.value})} placeholder="50000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <button onClick={handleSync} disabled={syncing} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60">
                  {syncing ? <><span className="animate-spin inline-block">⟳</span> Syncing...</> : <>🔄 Sync YouTube</>}
                </button>
                {syncResult && <div className={`mt-3 p-3 rounded-lg text-sm ${syncResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{syncResult.error ? `❌ ${syncResult.error}` : `✅ ${syncResult.message}`}</div>}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">📱</div>
                  <div><h2 className="font-bold text-gray-900">Instagram & Facebook Sync</h2><p className="text-sm text-gray-500">Update follower counts for influencers with handles set</p></div>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max to Sync</label>
                    <input type="number" value={socialLimit} onChange={e => setSocialLimit(e.target.value)} className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <button onClick={handleSocialSync} disabled={socialSyncing} className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60">
                  {socialSyncing ? <><span className="animate-spin inline-block">⟳</span> Syncing...</> : <>📲 Sync Instagram & Facebook</>}
                </button>
                {socialResult && <div className={`mt-3 p-3 rounded-lg text-sm ${socialResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{socialResult.error ? `❌ ${socialResult.error}` : `✅ ${socialResult.message}`}</div>}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
