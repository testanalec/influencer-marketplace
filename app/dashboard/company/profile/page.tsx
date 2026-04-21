"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const INDUSTRIES = ["Fashion","Beauty","Tech","Gaming","Fitness","Food","Travel","Lifestyle","Finance","Education","Healthcare","Real Estate","Automotive","Entertainment","Retail","Other"];

function stripProtocol(url: string) {
  return url.replace("https://", "").replace("http://", "");
}

export default function CompanyProfile() {
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
      fetch("/api/company/profile")
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
    const r = await fetch("/api/company/profile", {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700 flex-shrink-0">
                {profile.companyName?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile.companyName}</h1>
                <p className="text-sm text-gray-500">{profile.user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{profile.industry}</span>
                  {profile.website && (
                    <a href={profile.website} target="_blank" className="text-xs text-purple-600 hover:underline">{stripProtocol(profile.website)}</a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {saved && <span className="text-green-600 text-sm flex items-center gap-1">Saved</span>}
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setForm(profile); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit Profile</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-blue-600">{profile.industry || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Industry</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-green-600">Rs {Number(profile.budget)?.toLocaleString() || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Monthly Budget</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-700">{profile.phone || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Phone</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-700">{new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
            <p className="text-xs text-gray-500 mt-1">Member Since</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Company Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                {editing ? (
                  <input name="companyName" value={form.companyName || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                ) : <p className="text-sm text-gray-900">{profile.companyName || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                {editing ? (
                  <select name="industry" value={form.industry || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">{profile.industry || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                {editing ? (
                  <input name="website" value={form.website || ""} onChange={handleChange} placeholder="https://yourcompany.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                ) : profile.website ? (
                  <a href={profile.website} target="_blank" className="text-sm text-purple-600 hover:underline">{profile.website}</a>
                ) : <p className="text-sm text-gray-900">—</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                {editing ? (
                  <input name="phone" value={form.phone || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                ) : <p className="text-sm text-gray-900">{profile.phone || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Campaign Budget</label>
                {editing ? (
                  <input name="budget" type="number" value={form.budget || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                ) : <p className="text-sm text-gray-900">Rs {Number(profile.budget)?.toLocaleString() || "—"}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">About Company</label>
                {editing ? (
                  <textarea name="description" value={form.description || ""} onChange={handleChange} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                ) : <p className="text-sm text-gray-900 leading-relaxed">{profile.description || "—"}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/dashboard/company" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <span className="text-2xl">Home</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dashboard</p>
                  <p className="text-xs text-gray-500">View your dashboard and find influencers</p>
                </div>
              </a>
              <a href="/influencers" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <span className="text-2xl">People</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Browse Influencers</p>
                  <p className="text-xs text-gray-500">Discover and connect with influencers</p>
                </div>
              </a>
              <div className="bg-blue-50 rounded-xl p-4 mt-4">
                <p className="text-xs font-medium text-blue-700 mb-1">Profile Status</p>
                <p className="text-sm text-blue-600">Your profile is visible to influencers on the platform.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Account Email</p>
                <p className="text-sm text-gray-900">{profile.user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a href="/dashboard/company" className="text-sm text-gray-500 hover:text-blue-600">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
