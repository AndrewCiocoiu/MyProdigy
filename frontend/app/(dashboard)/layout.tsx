import React from "react";
import { UserNav } from "@/components/auth/UserNav";
import { WebSocketProvider } from "@/hooks/useWebSocket";
import { PartnerPresenceFetcher } from "@/components/ui/PartnerPresenceFetcher";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // WebSocketProvider must wrap the entire dashboard so all children share one WS connection
    <WebSocketProvider>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        {/* Header / Navbar */}
        <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">MyProdigy</h1>
            <nav className="flex items-center space-x-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cozy Focus Space</span>
              {/* Live partner presence indicator — fetches partner info from household status */}
              <PartnerPresenceFetcher />
              <UserNav />
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}
