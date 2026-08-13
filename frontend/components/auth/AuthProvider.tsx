"use client";

import { SessionProvider } from "next-auth/react";
import { WebSocketProvider } from "@/hooks/useWebSocket";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </SessionProvider>
  );
}
