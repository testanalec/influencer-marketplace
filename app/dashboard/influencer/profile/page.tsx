"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NICHES = ["Fashion","Beauty","Tech","Gaming","Fitness","Food","Travel","Lifestyle","Business","Education","Other"];
const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","UAE","Singapore","Germany","France","Brazil","Other"];

export default function InfluencerProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<any>({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/influencer/profile")
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            setProfile(data);
            setForm(data);
          } else {
            // No profile yet — show empty form in edit mode
            setProfile({});
            setForm({});
            setEditing(true);
          }
        })
        .catch(() => { setProfile({}); setForm({}); setEditing(true); })
        .finally(() => setProfileLoaded(true));
    }
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev: any) => ({ ...prev, avatar: reader.result as string }));
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
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

  if (status === "loading" || !profileLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading profile...</div>
      </div>
    );
  }

  const totalFollowers = (Number(form.instagramFollowers)||0) + (Number(form.youtubeFollowers)||0) + (Number(form.tiktokFollowers)||0) + (Number(form.twitterFollowers)||0);
  const displayProfile = editing ? form : profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-700 overflow-hidden border-2 border-purple-200">
                  {(editing ? form.avatar : profile?.avatar) ? (
                    <img src={editing ? form.avatar : profile.avatar} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    (profile?.name || session?.user?.name || "?").charAt(0).toUpperCase()
                  )}
                </div>
                {editing && (
                  <>
                    <button onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-purple-700 shadow">
                      +
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
                {avatarUploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl text-xs text-gray-500">...</div>}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.name || session?.user?.name || "Complete your profile"}</h1>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {profile?.niche && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">{profile.niche}</span>}
                  {profile?.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.status === "APPROVED" ? "bg-green-100 text-green-700" : profile.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {profile.status}
                    </span>
                  )}
                </div>
                {profile?.status === "PENDING" && (
                  <p className="text-xs text-amber-600 mt-1">Your profile is pending admin approval. You&apos;ll appear in search once approved.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {saved && <span className="text-green-600 text-sm">✓ Saved</span>}
              {editing ? (
                <>
                  {profile?.name && <button onClick={() => { setEditing(false); setForm(profile); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>}
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

        {/* Stats row */}
        {!editing && profile?.name && (
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
              <p className="text-lg font-bold text-blue-600">{[profile.city, profile.country].filter(Boolean).join(", ") || profile.location || "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Location</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-lg font-bold text-gray-700">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Member Since</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              {[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your full name" },
                { name: "phone", label: "Phone", type: "text", placeholder: "+91 98765 43210" },
                { name: "ratePerPost", label: "Rate Per Post (₹)", type: "number", placeholder: "e.g. 5000" },
                { name: "contactEmail", label: "Contact Email (public)", type: "email", placeholder: "contact@example.com" },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  {editing ? (
                    <input name={name} type={type} value={form[name] || ""} onChange={handleChange} placeholder={placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  ) : <p className="text-sm text-gray-900">{name === "ratePerPost" ? `₹${Number(displayProfile[name])?.toLocaleString() || "—"}` : displayProfile[name] || "—"}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Niche</label>
                {editing ? (
                  <select name="niche" value={form.niche || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="">Select niche</option>
                    {NICHES.map(n => <option key={n}>{n}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">{displayProfile.niche || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                {editing ? (
                  <select name="country" value={form.country || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">{displayProfile.country || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                {editing ? (
                  <input name="city" value={form.city || ""} onChange={handleChange} placeholder="e.g. Mumbai"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900">{displayProfile.city || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                {editing ? (
                  <textarea name="bio" value={form.bio || ""} onChange={handleChange} rows={4} placeholder="Tell brands about yourself..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                ) : <p className="text-sm text-gray-900 leading-relaxed">{displayProfile.bio || "—"}</p>}
              </div>
            </div>
          </div>

          {/* Social + Followers */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Social Media</h2>
              <div className="space-y-3">
                {[
                  { name: "instagram", label: "Instagram", color: "text-pink-600", placeholder: "https://instagram.com/yourhandle" },
                  { name: "youtube", label: "YouTube", color: "text-red-600", placeholder: "https://youtube.com/@yourchannel" },
                  { name: "tiktok", label: "TikTok", color: "text-black", placeholder: "https://tiktok.com/@yourhandle" },
                  { name: "twitter", label: "Twitter / X", color: "text-blue-500", placeholder: "https://x.com/yourhandle" },
                  { name: "facebook", label: "Facebook", color: "text-blue-700", placeholder: "https://facebook.com/yourpage" },
                  { name: "linkedin", label: "LinkedIn", color: "text-blue-800", placeholder: "https://linkedin.com/in/yourprofile" },
                ].map(({ name, label, color, placeholder }) => (
                  <div key={name}>
                    <label className={`block text-xs font-medium mb-0.5 ${color}`}>{label}</label>
                    {editing ? (
                      <input name={name} value={form[name] || ""} onChange={handleChange} placeholder={placeholder}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    ) : displayProfile[name] ? (
                      <a href={displayProfile[name]} target="_blank" rel="noopener noreferrer" className={`text-sm ${color} hover:underline break-all`}>{displayProfile[name]}</a>
                    ) : <p className="text-sm text-gray-400">—</p>}
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
                      <input name={name} type="number" value={form[name] || ""} onChange={handleChange} placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    ) : <p className="text-sm font-medium text-gray-900">{Number(displayProfile[name])?.toLocaleString() || "—"}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a href="/dashboard/influencer" className="text-sm text-gray-500 hover:text-purple-600">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
