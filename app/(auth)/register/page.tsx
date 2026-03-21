"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 gradient-text">
            Join Our Marketplace
          </h1>
          <p className="text-center text-gray-600 mb-12">
            Choose your role to get started
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Influencer Option */}
            <Link href="/register/influencer">
              <div className="card hover:border-primary-600 border-2 border-transparent cursor-pointer">
                <div className="text-5xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold mb-3">I&apos;m an Influencer</h2>
                <p className="text-gray-600 mb-6">
                  Register as a content creator and start receiving collaboration
                  proposals from brands looking to partner with you.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Build your profile</p>
                  <p>✓ Showcase your platforms</p>
                  <p>✓ Receive brand proposals</p>
                  <p>✓ Manage collaborations</p>
                </div>
              </div>
            </Link>

            {/* Company Option */}
            <Link href="/register/company">
              <div className="card hover:border-primary-600 border-2 border-transparent cursor-pointer">
                <div className="text-5xl mb-4">🏢</div>
                <h2 className="text-2xl font-bold mb-3">I&apos;m a Brand</h2>
                <p className="text-gray-600 mb-6">
                  Register as a brand or company and discover thousands of
                  verified influencers to partner with for your campaigns.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Search influencers</p>
                  <p>✓ Send proposals</p>
                  <p>✓ Manage campaigns</p>
                  <p>✓ Track performance</p>
                </div>
              </div>
            </Link>
          </div>

          <p className="text-center text-gray-600 mt-8">
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
