"use client"

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Building2, Users, Tags } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isSignedIn && isLoaded && user ? { ownerId: user.id } : "skip",
  );

  const stats = useQuery(
    api.business.getBusinessDashbaordStats,
    business ? { businessId: business?._id } : "skip",
  );

  useEffect(() => {
    if (business === null) router.push("/onboarding");
  }, [business]);

  if (business === undefined) return null;
  if (business === null) return null;

  return (
    <div className="max-w-5xl mx-auto py-10 px-8">
      {/* Header section */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Overview
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your organization and monitor key metrics.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Business Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Organization
              </p>
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {business.name}
              </h3>
            </div>
          </div>
          <p className="text-gray-500 text-sm line-clamp-2">
            {business.description || "No description provided."}
          </p>
        </div>

        {/* Customer Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Total Customers
              </p>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-4xl font-bold text-gray-900">
              {stats ? stats.customerCount : "..."}
            </h3>
          </div>
        </div>

        {/* Group Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Tags size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Customer Groups
              </p>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-4xl font-bold text-gray-900">
              {stats ? stats.groupCount : "..."}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
