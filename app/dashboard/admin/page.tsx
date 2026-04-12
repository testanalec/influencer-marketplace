"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NICHES = ["All", "Fashion", "Beauty", "Tech", "Gaming", "Fitness", "Food", "Travel", "Lifestyle"];

export default function AdminDashboard() {
 const { data: session, status } = useSession();
 const router = useRouter();

 const [syncing, setSyncing] = useState(false);
 const [syncResult, setSyncResult] = useState<any>(null);
 const [filters, setFilters] = useState({
  niche: "",
  minFollowers: "",
  maxRate: "",
 });

 const [socialSyncing, setSocialSyncing] = useState(false);
 const [socialResult, setSocialResult] = useState<any>(null);
 const [socialStatus, setSocialStatus] = useState<{ instagramConfigured: boolean; facebookConfigured: boolean } | null>(null);
 const [socialLimit, setSocialLimit] = useState("50");

 const [stats, setStats] = useState<{ total: number; byNiche: Record<string, number> } | null>(null);

 useEffect(() => {
  if (status === "unauthenticated") router.push("/login");
  if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/");
 }, [status, session]);

 useEffect(() => {
  fetchStats();
  fetchSocialStatus();
 }, []);

 const fetchStats = async () => {
  try {
   const res = await fetch("/api/admin/stats");
   if (res.ok) {
    const data = await res.json();
    setStats(data);
   }
  } catch {}
 };

 const fetchSocialStatus = async () => {
  try {
   const res = await fetch("/api/social/sync");
   if (res.ok) {
    const data = await res.json();
    setSocialStatus(data);
   }
  } catch {}
 };

 const handleSync = async () => {
  setSyncing(true);
  setSyncResult(null);
  try {
   const body: any = {};
   if (filters.niche && filters.niche !== "All") body.niche = filters.niche;
   if (filters.minFollowers) body.minFollowers = parseInt(filters.minFollowers);
   if (filters.maxRate) body.maxRate = parseInt(filters.maxRate);

   const res = await fetch("/api/youtube/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
   });
   const data = await res.json();
   setSyncResult(data);
   fetchStats();
  } catch (err) {
   setSyncResult({ error: "Sync failed" });
  } finally {
   setSyncing(false);
  }
 };

 const handleSocialSync = async () => {
  setSocialSyncing(true);
  setSocialResult(null);
  try {
   const body: any = {};
   if (socialLimit) body.limit = parseInt(socialLimit);

   const res = await fetch("/api/social/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
   });
   const data = await res.json();
   setSocialResult(data);
   fetchStats();
  } catch (err) {
   setSocialResult({ error: "Social sync failed" });
  } finally {
   setSocialSyncing(false);
  }
 };

 if (status === "loading") {
  return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
 }

 if (session?.user?.role !== "ADMIN") return null;

 return (
  <div className="min-h-screen bg-gray-50 py-8">
   <div className="container mx-auto px-4 max-w-4xl">
    <h1 className="text-3xl font-bold mb-2">⚙️ Admin Dashboard</h1>
    <p className="text-gray-500 mb-8">Manage influencer data and platform settings</p>

    {/* Stats */}
    {stats && (
     <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">📊 Database Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
       <div className="text-center p-4 bg-purple-50 rounded-lg">
        <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
        <p className="text-sm text-gray-600">Total Influencers</p>
       </div>
       {Object.entries(stats.byNiche).slice(0, 3).map(([niche, count]) => (
        <div key={niche} className="text-center p-4 bg-blue-50 rounded-lg">
         <p className="text-3xl font-bold text-blue-600">{count as number}</p>
         <p className="text-sm text-gray-600">{niche}</p>
        </div>
       ))}
      </div>
     </div>
    )}

    {/* YouTube Sync Panel */}
    <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-red-500">
     <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
      ▶️ YouTube Influencer Sync
     </h2>
     <p className="text-gray-500 text-sm mb-6">
      Auto-fetch YouTube influencers from India across different niches. Existing influencers will be updated with fresh subscriber counts.
     </p>

     {/* Filters */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Category / Niche</label>
       <select
        value={filters.niche}
        onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
       >
        {NICHES.map((n) => (
         <option key={n} value={n === "All" ? "" : n}>{n}</option>
        ))}
       </select>
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Min Followers</label>
       <input
        type="number"
        value={filters.minFollowers}
        onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })}
        placeholder="e.g. 10000"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Max Rate Per Post (₹)</label>
       <input
        type="number"
        value={filters.maxRate}
        onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
        placeholder="e.g. 50000"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
       />
      </div>
     </div>

     <button
      onClick={handleSync}
      disabled={syncing}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
     >
      {syncing ? (
       <>
        <span className="animate-spin">⟳</span>
        Syncing YouTube...
       </>
      ) : (
       <>🔄 Sync YouTube Influencers</>
      )}
     </button>

     {syncResult && (
      <div className={`mt-4 p-4 rounded-lg ${syncResult.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
       {syncResult.error ? (
        <p>❌ {syncResult.error}</p>
       ) : (
        <>
         <p className="font-semibold">✅ {syncResult.message}</p>
         {syncResult.filters && Object.keys(syncResult.filters).length > 0 && (
          <p className="text-sm mt-1">
           Filters applied: {JSON.stringify(syncResult.filters)}
          </p>
         )}
         {syncResult.errors && syncResult.errors.length > 0 && (
          <details className="mt-2">
           <summary className="cursor-pointer text-sm">View errors ({syncResult.errors.length})</summary>
           <ul className="mt-1 text-xs space-y-1">
            {syncResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
           </ul>
          </details>
         )}
        </>
       )}
      </div>
     )}
    </div>

    {/* Instagram & Facebook Sync Panel */}
    <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-pink-500">
     <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
      📱 Instagram & Facebook Follower Sync
     </h2>
     <p className="text-gray-500 text-sm mb-4">
      Sync Instagram and Facebook follower counts for influencers who have their handles set. Requires API tokens in Vercel environment variables.
     </p>

     {/* Token status */}
     {socialStatus && (
      <div className="flex gap-4 mb-6">
       <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${socialStatus.instagramConfigured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
        {socialStatus.instagramConfigured ? "✅" : "⚠️"} Instagram Token {socialStatus.instagramConfigured ? "Configured" : "Not Set"}
       </div>
       <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${socialStatus.facebookConfigured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
        {socialStatus.facebookConfigured ? "✅" : "⚠️"} Facebook Token {socialStatus.facebookConfigured ? "Configured" : "Not Set"}
       </div>
      </div>
     )}

     <div className="flex items-end gap-4 mb-6">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Max Profiles to Sync</label>
       <input
        type="number"
        value={socialLimit}
        onChange={(e) => setSocialLimit(e.target.value)}
        placeholder="50"
        min="1"
        max="500"
        className="w-40 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
       />
      </div>
     </div>

     <button
      onClick={handleSocialSync}
      disabled={socialSyncing}
      className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
     >
      {socialSyncing ? (
       <>
        <span className="animate-spin">⟳</span>
        Syncing Social...
       </>
      ) : (
       <>📲 Sync Instagram & Facebook Followers</>
      )}
     </button>

     {socialResult && (
      <div className={`mt-4 p-4 rounded-lg ${socialResult.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
       {socialResult.error ? (
        <p>❌ {socialResult.error}</p>
       ) : (
        <>
         <p className="font-semibold">✅ {socialResult.message}</p>
         <div className="grid grid-cols-3 gap-3 mt-3 text-center">
          <div className="bg-white rounded p-2">
           <p className="text-lg font-bold text-pink-600">{socialResult.instagramSynced}</p>
           <p className="text-xs text-gray-500">Instagram Updated</p>
          </div>
          <div className="bg-white rounded p-2">
           <p className="text-lg font-bold text-blue-600">{socialResult.facebookSynced}</p>
           <p className="text-xs text-gray-500">Facebook Updated</p>
          </div>
          <div className="bg-white rounded p-2">
           <p className="text-lg font-bold text-gray-500">{socialResult.skipped}</p>
           <p className="text-xs text-gray-500">Skipped</p>
          </div>
         </div>
         {socialResult.errors && socialResult.errors.length > 0 && (
          <details className="mt-2">
           <summary className="cursor-pointer text-sm">View errors ({socialResult.errors.length})</summary>
           <ul className="mt-1 text-xs space-y-1">
            {socialResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
           </ul>
          </details>
         )}
        </>
       )}
      </div>
     )}

     {!socialStatus?.instagramConfigured && !socialStatus?.facebookConfigured && (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
       <p className="font-semibold mb-1">⚙️ Setup Required</p>
       <p>Add these to your Vercel environment variables to enable social sync:</p>
       <ul className="mt-1 list-disc list-inside space-y-0.5">
        <li><code>INSTAGRAM_ACCESS_TOKEN</code> — Meta Graph API long-lived token</li>
        <li><code>FACEBOOK_ACCESS_TOKEN</code> — Facebook page access token</li>
       </ul>
      </div>
     )}
    </div>

    {/* Info */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
     <p className="font-semibold mb-1">⚠️ YouTube API Quota Note</p>
     <p>The free YouTube API tier allows ~10,000 units/day. Each search uses 100 units. Avoid running sync too frequently to preserve quota for the next day.</p>
    </div>
   </div>
  </div>
 );
}
