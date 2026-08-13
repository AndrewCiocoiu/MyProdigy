import React from "react";
import Link from "next/link";
import { UserNav } from "@/components/auth/UserNav";
import { PartnerPresenceFetcher } from "@/components/ui/PartnerPresenceFetcher";
import { GlobalSessionBanner } from "@/components/timer/GlobalSessionBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Global Join Banner when Partner starts working */}
      <GlobalSessionBanner />

      {/* Header / Navbar */}
      <header className="border-b border-zinc-200 bg-white px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              MyProdigy
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold">
              <Link
                href="/"
                className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition"
              >
                Home
              </Link>
              <Link
                href="/focus"
                className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition flex items-center gap-1.5"
              >
                <span>Focus Timer</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live partner presence indicator */}
            <PartnerPresenceFetcher />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
