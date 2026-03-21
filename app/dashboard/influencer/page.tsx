"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Deal } from "@/types";

export default function InfluencerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "INFLUENCER") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDeals();
    }
  }, [status]);

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals");
      const data = await response.json();
      setDeals(data);
    } catch (err) {
      console.error("Failed to fetch deals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDealUpdate = async (dealId: string, status: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchDeals();
      }
    } catch (err) {
      console.error("Failed to update deal:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const pendingDeals = deals.filter((d) => d.status === "PENDING").length;
  const acceptedDeals = deals.filter((d) => d.status === "ACCEPTED").length;
  const totalEarnings = deals
    .filter((d) => d.status === "COMPLETED")
    .reduce((sum, d) => sum + d.dealValue, 0);

  const filteredDeals =
    filter === "ALL"
      ? deals
      : deals.filter((d) => d.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {session?.user.name}!
          </h1>
          <button
            onClick={() => signOut()}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 text-sm mb-2">Pending Proposals</p>
            <p className="text-4xl font-bold text-primary-600">{pendingDeals}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm mb-2">Active Collaborations</p>
            <p className="text-4xl font-bold text-primary-600">{acceptedDeals}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm mb-2">Total Earnings</p>
            <p className="text-4xl font-bold text-primary-600">
              ₹{totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Deals Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Collaboration Proposals</h2>
            <div className="space-x-2">
              {["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      filter === status
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredDeals.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No proposals found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Title</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Deal Value</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-semibold">{deal.title}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {deal.description.substring(0, 50)}...
                      </td>
                      <td className="py-4 px-4 font-semibold text-primary-600">
                        ₹{deal.dealValue.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            deal.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : deal.status === "ACCEPTED"
                              ? "bg-green-100 text-green-700"
                              : deal.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {deal.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {deal.status === "PENDING" && (
                          <div className="space-x-2">
                            <button
                              onClick={() =>
                                handleDealUpdate(deal.id, "ACCEPTED")
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleDealUpdate(deal.id, "REJECTED")
                              }
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
