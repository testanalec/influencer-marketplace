"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function InfluencerRegisterPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isGoogle = searchParams.get("google") === "true";
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", name: "", phone: "",
    bio: "", niche: "", instagram: "", youtube: "", tiktok: "",
    instagramFollowers: "", youtubeFollowers: "", tiktokFollowers: "", ratePerPost: "",
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isGoogle && session?.user) {
      setFormData((prev) => ({ ...prev, email: session.user.email || "", name: session.user.name || "" }));
    }
  }, [isGoogle, session]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email) { setError("Name and email are required."); return; }
      if (!isGoogle && (!formData.password || formData.password !== formData.confirmPassword)) { setError("Passwords do not match."); return; }
    }
    setError(""); setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const body = {
        email: formData.email, name: formData.name, phone: formData.phone,
        bio: formData.bio, niche: formData.niche, instagram: formData.instagram,
        youtube: formData.youtube, tiktok: formData.tiktok,
        instagramFollowers: formData.instagramFollowers, youtubeFollowers: formData.youtubeFollowers,
        tiktokFollowers: formData.tiktokFollowers, ratePerPost: formData.ratePerPost, role: "INFLUENCER",
      };
      if (!isGoogle) { body.password = formData.password; } else { body.googleSignIn = "true"; }
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      router.push("/dashboard/influencer");
    } catch { setError("Something went wrong."); } finally { setLoading(false); }
  };

  const niches = ["Lifestyle","Fashion","Tech","Food","Travel","Fitness","Beauty","Gaming","Education","Finance","Other"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Register as Influencer</h1>
          {isGoogle && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">Signing up with Google. Your email is pre-filled.</div>}
          <div className="flex mb-6 gap-2">
            {[1,2,3].map((s) => (<div key={s} className={"flex-1 h-2 rounded-full " + (step >= s ? "bg-primary-500" : "bg-gray-200")} />))}
          </div>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Account Details</h2>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required readOnly={isGoogle} className={"w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" + (isGoogle ? " bg-gray-100 cursor-not-allowed" : "")} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                {!isGoogle && (<><div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div></>)}
                <button type="button" onClick={handleNext} className="w-full btn-primary py-2 rounded-lg">Next</button>
                {!isGoogle && <p className="text-center text-sm text-gray-600">Already have an account? <Link href="/login" className="text-primary-600 hover:underline">Sign in</Link></p>}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Profile Details</h2>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Niche *</label><select name="niche" value={formData.niche} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2"><option value="">Select a niche</option>{niches.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Rate Per Post (Rs)</label><input type="number" name="ratePerPost" value={formData.ratePerPost} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Back</button><button type="button" onClick={handleNext} className="flex-1 btn-primary py-2 rounded-lg">Next</button></div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Social Media</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label><input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@username" className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Instagram Followers</label><input type="number" name="instagramFollowers" value={formData.instagramFollowers} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">YouTube Channel</label><input type="text" name="youtube" value={formData.youtube} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">YouTube Subscribers</label><input type="number" name="youtubeFollowers" value={formData.youtubeFollowers} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">TikTok Handle</label><input type="text" name="tiktok" value={formData.tiktok} onChange={handleChange} placeholder="@username" className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">TikTok Followers</label><input type="number" name="tiktokFollowers" value={formData.tiktokFollowers} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                </div>
                <div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Back</button><button type="submit" disabled={loading} className="flex-1 btn-primary py-2 rounded-lg disabled:opacity-50">{loading ? "Registering..." : "Complete Registration"}</button></div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
