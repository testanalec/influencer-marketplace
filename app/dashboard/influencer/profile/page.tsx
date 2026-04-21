"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NICHES = ["Fashion","Beauty","Tech","Gaming","Fitness","Food","Travel","Lifestyle","Business","Education","Other"];

export default function InfluencerProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/influencer/profile")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) { setProfile(data); setForm(data); }
        });
    }
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const r = await fetch("/api/influencer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      const updated = await r.json();
      setProfile(updated);
      setForm(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (status === "loading" || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading profile...</div>
      </div>
    );
  }

  const totalFollowers = (Number(profile.instagramFollowers)||0) + (Number(profile.youtubeFollowers)||0) + (Number(profile.tiktokFollowers)||0) + (Number(profile.twitterFollowers)||0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-700 overflow-hidden flex-shrink-0">
                {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : profile.name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-sm text-gray-500">{profile.user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">{profile.niche}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.status === "APPROVED" ? "bg-green-100 text-green-700" : profile.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {saved && <span className="text-green-600 text-sm flex items-center gap-1">✓ Saved</span>}
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setForm(profile); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Edit Profile</button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalFollowers >= 1000000 ? `${(totalFollowers/1000000).toFixed(1)}M` : totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(0)}K` : totalFollowers || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Total Followers</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">₹{Number(profile.ratePerPost)?.toLocaleString() || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Rate Per Post</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{profile.location || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Location</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
            <p className="text-xs text-gray-500 mt-1">Member Since</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                {editing ? (
                  <input name="name" value={form.name || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900">{profile.name || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Niche</label>
                {editing ? (
                  <select name="niche" value={form.niche || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {NICHES.map(n => <option key={n}>{n}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">{profile.niche || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                {editing ? (
                  <input name="phone" value={form.phone || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900">{profile.phone || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                {editing ? (
                  <input name="location" value={form.location || ""} onChange={handleChange} placeholder="e.g. Mumbai, India" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900">{profile.location || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rate Per Post (₹)</label>
                {editing ? (
                  <input name="ratePerPost" type="number" value={form.ratePerPost || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900">₹{Number(profile.ratePerPost)?.toLocaleString() || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                {editing ? (
                  <textarea name="bio" value={form.bio || ""} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900 leading-relaxed">{profile.bio || "—"}</p>}
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Social Media Handles</h2>
              <div className="space-y-3">
                {[
                  { name: "instagram", label: "Instagram", icon: "📸", placeholder: "@handle" },
                  { name: "youtube", label: "YouTube", icon: "▶️", placeholder: "Channel URL" },
                  { name: "tiktok", label: "TikTok", icon: "🎵", placeholder: "@handle" },
                  { name: "twitter", label: "Twitter/X", icon: "𝕏", placeholder: "@handle" },
                  { name: "facebook", label: "Facebook", icon: "👤", placeholder: "Page URL" },
                  { name: "linkedin", label: "LinkedIn", icon: "💼", placeholder: "Profile URL" },
                ].map(({ name, label, icon, placeholder }) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="w-7 text-lg flex-shrink-0">{icon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                      {editing ? (
                        <input name={name} value={form[name] || ""} onChange={handleChange} placeholder={placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      ) : <p className="text-sm text-gray-900">{profile[name] || "—"}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Follower Counts</h2>
              <div className="space-y-3">
                {[
                  { name: "instagramFollowers", label: "Instagram Followers" },
                  { name: "youtubeFollowers", label: "YouTube Subscribers" },
                  { name: "tiktokFollowers", label: "TikTok Followers" },
                  { name: "twitterFollowers", label: "Twitter Followers" },
                  { name: "facebookFollowers", label: "Facebook Followers" },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                    {editing ? (
                      <input name={name} type="number" value={form[name] || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    ) : <p className="text-sm font-medium text-gray-900">{Number(profile[name])?.toLocaleString() || "—"}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <a href="/dashboard/influencer" className="text-sm text-gray-500 hover:text-purple-600">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
