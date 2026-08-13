"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { WebSocketClient } from "@/lib/websocket/wsClient";
import { useSession } from "next-auth/react";

interface WSMessagePayload {
  event: string;
  data: unknown;
}

interface PendingSubscription {
  event: string;
  callback: (data: unknown) => void;
}

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  sendEvent: (event: string, data: unknown) => void;
  lastEvent: WSMessagePayload | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

let globalWSClient: WebSocketClient | null = null;
let activeListeners = new Map<string, Set<(data: unknown) => void>>();

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return Boolean(globalWSClient?.isConnected);
  });
  const [lastEvent, setLastEvent] = useState<WSMessagePayload | null>(null);

  useEffect(() => {
    if (!session?.user) {
      if (globalWSClient) {
        globalWSClient.disconnect();
        globalWSClient = null;
      }
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    async function initWS() {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();
        if (!token || !isMounted) return;

        const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

        if (!globalWSClient) {
          globalWSClient = new WebSocketClient(wsBaseUrl, token);
        }

        // Check if already open
        if (globalWSClient.isConnected && isMounted) {
          setIsConnected(true);
        }

        globalWSClient.on("status_change", (data: { status: string }) => {
          if (!isMounted) return;
          const connected = data.status === "connected";
          setIsConnected(connected);
        });

        // Re-attach any listeners registered so far
        activeListeners.forEach((callbacks, event) => {
          callbacks.forEach((cb) => {
            globalWSClient?.on(event, cb);
          });
        });

        globalWSClient.connect();
      } catch (err) {
        console.error("[WS] Initialization failed:", err);
      }
    }

    initWS();

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  /**
   * Subscribe to a WS event.
   * Tracks callbacks in activeListeners and binds them to the underlying client.
   */
  const subscribe = (event: string, callback: (data: unknown) => void) => {
    if (!activeListeners.has(event)) {
      activeListeners.set(event, new Set());
    }
    activeListeners.get(event)!.add(callback);

    let unsubClient: (() => void) | undefined;
    if (globalWSClient) {
      unsubClient = globalWSClient.on(event, callback);
    }

    return () => {
      activeListeners.get(event)?.delete(callback);
      unsubClient?.();
    };
  };

  const sendEvent = (event: string, data: unknown) => {
    if (globalWSClient) {
      globalWSClient.send(event, data);
    }
  };

  return React.createElement(
    WebSocketContext.Provider,
    { value: { isConnected, subscribe, sendEvent, lastEvent } },
    children
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    return {
      isConnected: false,
      subscribe: () => () => {},
      sendEvent: () => {},
      lastEvent: null,
    };
  }
  return context;
}
