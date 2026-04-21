"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isInfluencer = session?.user?.role === "INFLUENCER";

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold gradient-text">
          InfluMarket
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/influencers" className="text-gray-700 hover:text-primary-600">
            Browse
          </Link>
          {session ? (
            <>
              <Link
                href={isInfluencer ? "/dashboard/influencer" : "/dashboard/company"}
                className="text-gray-700 hover:text-primary-600"
              >
                Dashboard
              </Link>
              <Link
                href={isInfluencer ? "/dashboard/influencer/profile" : "/dashboard/company/profile"}
                className="text-gray-700 hover:text-primary-600"
              >
                Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="btn-secondary text-sm px-4 py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-primary-600">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link href="/influencers" className="block text-gray-700 hover:text-primary-600">
              Browse
            </Link>
            {session ? (
              <>
                <Link
                  href={isInfluencer ? "/dashboard/influencer" : "/dashboard/company"}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Dashboard
                </Link>
                <Link
                  href={isInfluencer ? "/dashboard/influencer/profile" : "/dashboard/company/profile"}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Profile
                </Link>
                <button onClick={() => signOut()} className="w-full text-left btn-secondary">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-700 hover:text-primary-600">
                  Sign In
                </Link>
                <Link href="/register" className="block btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
