"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompanyRegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phone: "",
    industry: "",
    website: "",
    description: "",
    budget: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          role: "COMPANY",
          company: {
            companyName: formData.companyName,
            phone: formData.phone,
            industry: formData.industry,
            website: formData.website,
            description: formData.description,
            budget: formData.budget,
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

  const industries = [
    "Fashion & Apparel", "Beauty & Cosmetics", "Technology", "Food & Beverage",
    "Travel & Tourism", "Health & Fitness", "Home & Lifestyle", "Entertainment",
    "Education", "Finance", "Automotive", "Sports",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 gradient-text">
            Register Your Brand
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Find the perfect influencers to promote your brand
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-field" />
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Company Name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="input-field" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Industry</label>
                    <select name="industry" value={formData.industry} onChange={handleChange} required className="input-field">
                      <option value="">Select an industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Website</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="input-field" placeholder="https://example.com" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Company Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required className="input-field" rows={3} placeholder="Tell us about your company..." />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Campaign Budget</h2>
              <div>
                <label className="form-label">Monthly Budget Range</label>
                <select name="budget" value={formData.budget} onChange={handleChange} required className="input-field">
                  <option value="">Select a budget range</option>
                  <option value="10000-50000">₹10,000 - ₹50,000</option>
                  <option value="50000-100000">₹50,000 - ₹1,00,000</option>
                  <option value="100000-500000">₹1,00,000 - ₹5,00,000</option>
                  <option value="500000-2000000">₹5,00,000 - ₹20,00,000</option>
                  <option value="2000000+">₹20,00,000+</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
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
