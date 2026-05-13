"use client";

import { api } from "@/convex/_generated/api";
import { UserButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import {
  LayoutDashboard,
  Users,
  Tags,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/");
  }, [isLoaded, isSignedIn, user]);

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/groups", label: "Groups", icon: Tags },
    { href: "/templates", label: "Templates", icon: MessageSquare },
    { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-gray-50/50">
      <Authenticated>
        {business && (
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col md:flex shrink-0">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold">
                  C
                </div>
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  Agent
                </span>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                      isActive
                        ? "bg-gray-100/80 text-gray-900"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-gray-900" : "text-gray-400"}
                    />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-2">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9",
                    },
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {user?.fullName}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </Authenticated>
      <Unauthenticated>
        <h1>Who are you?</h1>
      </Unauthenticated>
    </div>
  );
}
