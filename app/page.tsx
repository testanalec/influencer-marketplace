import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Connect with the Right Influencer
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            The modern marketplace where brands discover authentic creators and
            influencers find meaningful collaborations
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/influencers"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Browse Influencers
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-primary-600 mb-2">
                1000+
              </h3>
              <p className="text-gray-600">Verified Influencers</p>
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-bold text-primary-600 mb-2">500+</h3>
              <p className="text-gray-600">Active Brands</p>
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-bold text-primary-600 mb-2">
                ₹10Cr+
              </h3>
              <p className="text-gray-600">Total Deals Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 gradient-text">
          Why Choose Us?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-3">Precise Matching</h3>
            <p className="text-gray-600">
              Our algorithm matches brands with influencers based on niche,
              audience, and values for authentic collaborations.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-3">Transparent Pricing</h3>
            <p className="text-gray-600">
              Clear pricing structure with 10% platform commission ensuring
              both parties know exactly what they&apos;re getting.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-3">Secure Deals</h3>
            <p className="text-gray-600">
              All collaborations are protected by our escrow system ensuring
              safe and trustworthy transactions.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Track campaign performance and ROI with detailed analytics and
              reporting tools.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-bold mb-3">Multi-Platform</h3>
            <p className="text-gray-600">
              Support for all major platforms: Instagram, YouTube, TikTok,
              Twitter, and LinkedIn.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-3">Community Support</h3>
            <p className="text-gray-600">
              Join a vibrant community of creators and brands with dedicated
              support team.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-primary-50 section-container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* For Influencers */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-primary-600">
              For Influencers
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Create Your Profile</h4>
                  <p className="text-gray-600">
                    Sign up and build your profile showcasing your niche,
                    platforms, and follower counts.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Receive Proposals</h4>
                  <p className="text-gray-600">
                    Brands discover you and send collaboration proposals with
                    their offers.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Accept & Collaborate</h4>
                  <p className="text-gray-600">
                    Review proposals, negotiate if needed, and start your
                    collaboration.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Earn & Grow</h4>
                  <p className="text-gray-600">
                    Complete the collaboration and earn while building your
                    portfolio.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* For Brands */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-primary-600">
              For Brands
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Set Up Your Account</h4>
                  <p className="text-gray-600">
                    Register your brand and define your campaign requirements
                    and budget.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Search & Discover</h4>
                  <p className="text-gray-600">
                    Use advanced filters to find influencers matching your niche
                    and audience.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Send Proposals</h4>
                  <p className="text-gray-600">
                    Send collaboration proposals with your campaign details and
                    offer.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Launch Campaign</h4>
                  <p className="text-gray-600">
                    Once accepted, monitor the campaign and track its
                    performance in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of influencers and brands on our platform
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Your Account Now
          </Link>
        </div>
      </section>
    </div>
  );
}
