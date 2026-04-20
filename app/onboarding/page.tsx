"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

  useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated" && session?.user?.role !== "PENDING_ONBOARDING") {
                const role = session.user.role;
                if (role === "ADMIN") router.push("/dashboard/admin");
                else if (role === "INFLUENCER") router.push("/dashboard/influencer");
                else if (role === "COMPANY") router.push("/dashboard/company");
        }
  }, [status, session, router]);

  const handleSelect = (role: "INFLUENCER" | "COMPANY") => {
        if (role === "INFLUENCER") {
                router.push("/register/influencer?google=true");
        } else {
                router.push("/register/company?google=true");
        }
  };

  if (status === "loading") {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>div>;
  }
  
    return (
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-2xl">
                        <div className="bg-white rounded-lg shadow-lg p-10 text-center">
                                  <h1 className="text-3xl font-bold mb-3 gradient-text">Welcome to InfluMarket!</h1>h1>
                                  <p className="text-gray-600 mb-10 text-lg">
                                              Tell us who you are so we can set up your account correctly.
                                  </p>p>
                        
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <button
                                                              onClick={() => handleSelect("INFLUENCER")}
                                                              className="group border-2 border-gray-200 hover:border-primary-500 rounded-xl p-8 text-left transition-all hover:shadow-lg"
                                                            >
                                                            <div className="text-5xl mb-4">🎥</div>div>
                                                            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary-600">I'm an Influencer</h2>h2>
                                                            <p className="text-gray-500">I create content and want to collaborate with brands.</p>p>
                                              </button>button>
                                  
                                              <button
                                                              onClick={() => handleSelect("COMPANY")}
                                                              className="group border-2 border-gray-200 hover:border-primary-500 rounded-xl p-8 text-left transition-all hover:shadow-lg"
                                                            >
                                                            <div className="text-5xl mb-4">🏢</div>div>
                                                            <h2 className="text-2xl font-bold mb-2 group-hover:tex</div>
