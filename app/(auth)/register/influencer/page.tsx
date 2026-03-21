"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InfluencerRegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    bio: "",
    niche: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    instagramFollowers: "",
    youtubeFollowers: "",
    tiktokFollowers: "",
    ratePerPost: "",
    location: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: "INFLUENCER",
          influencer: {
            name: formData.name,
            bio: formData.bio,
            niche: formData.niche,
            instagram: formData.instagram,
            youtube: formData.youtube,
            tiktok: formData.tiktok,
            instagramFollowers: formData.instagramFollowers
              ? parseInt(formData.instagramFollowers)
              : null,
            youtubeFollowers: formData.youtubeFollowers
              ? parseInt(formData.youtubeFollowers)
              : null,
            tiktokFollowers: formData.tiktokFollowers
              ? parseInt(formData.tiktokFollowers)
              : null,
            ratePerPost: parseFloat(formData.ratePerPost),
            location: formData.location,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const niches = [
    "Fashion",
    "Beauty",
    "Tech",
    "Food",
    "Travel",
    "Fitness",
    "Lifestyle",
    "Entertainment",
    "Education",
    "Business",
    "Sports",
    "Gaming",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 gradient-text">
            Become an Influencer
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Create your profile and start receiving collaboration proposals
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    className="input-field"
                    rows={3}
                    placeholder="Tell us about yourself and your content..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Niche</label>
                    <select
                      name="niche"
                      value={formData.niche}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select a niche</option>
                      {niches.map((niche) => (
                        <option key={niche} value={niche}>
                          {niche}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">Social Media Profiles</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Instagram Handle</label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="@yourhandle"
                    />
                  </div>
                  <div>
                    <label className="form-label">Instagram Followers</label>
                    <input
                      type="number"
                      name="instagramFollowers"
                      value={formData.instagramFollowers}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">YouTube Channel</label>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Channel name"
                    />
                  </div>
                  <div>
                    <label className="form-label">YouTube Followers</label>
                    <input
                      type="number"
                      name="youtubeFollowers"
                      value={formData.youtubeFollowers}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">TikTok Handle</label>
                    <input
                      type="text"
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="@yourhandle"
                    />
                  </div>
                  <div>
                    <label className="form-label">TikTok Followers</label>
                    <input
                      type="number"
                      name="tiktokFollowers"
                      value={formData.tiktokFollowers}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Collaboration Rate</h2>
              <div>
                <label className="form-label">Rate Per Post (₹)</label>
                <input
                  type="number"
                  name="ratePerPost"
                  value={formData.ratePerPost}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="25000"
                  step="1000"
                  min="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
