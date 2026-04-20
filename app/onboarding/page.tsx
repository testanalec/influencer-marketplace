"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "PENDING_ONBOARDING") {
      const role = session.user.role;
      if (role === "ADMIN") router.push("/dashboard/admin");
      else if (role === "INFLUENCER") router.push("/dashboard/influencer");
      else if (role === "COMPANY") router.push("/dashboard/company");
    }
  }, [status, session, router]);

  const handleSelect = async (role: "INFLUENCER" | "COMPANY") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      await update();
      router.push(role === "INFLUENCER" ? "/dashboard/influencer" : "/dashboard/company");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-10 text-center">
          <h1 className="text-3xl font-bold mb-3 gradient-text">Welcome to InfluMarket!</h1>
          <p className="text-gray-600 mb-10 text-lg">
            Tell us who you are so we can set up your account correctly.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleSelect("INFLUENCER")}
              disabled={loading}
              className="group border-2 border-gray-200 hover:border-primary-500 rounded-xl p-8 text-left transition-all hover:shadow-lg disabled:opacity-50"
            >
              <div className="text-5xl mb-4">🎥</div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary-600">I'm an Influencer</h2>
              <p className="text-gray-500">I create content and want to collaborate with brands.</p>
            </button>

            <button
              onClick={() => handleSelect("COMPANY")}
              disabled={loading}
              className="group border-2 border-gray-200 hover:border-primary-500 rounded-xl p-8 text-left transition-all hover:shadow-lg disabled:opacity-50"
            >
              <div className="text-5xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary-600">I'm a Brand</h2>
              <p className="text-gray-500">I want to find influencers for my marketing campaigns.</p>
            </button>
          </div>

          {loading && <p className="mt-6 text-gray-500">Setting up your account...</p>}
        </div>
      </div>
    </div>
  );
}
