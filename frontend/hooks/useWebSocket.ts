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
// Queue subscriptions that arrive before the client is ready
let pendingSubscriptions: PendingSubscription[] = [];

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSMessagePayload | null>(null);
  // Track whether the WS client is ready so subscribe() can gate correctly
  const clientReadyRef = useRef(false);

  useEffect(() => {
    if (!session?.user) {
      if (globalWSClient) {
        globalWSClient.disconnect();
        globalWSClient = null;
        clientReadyRef.current = false;
        pendingSubscriptions = [];
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

        globalWSClient.on("status_change", (data: { status: string }) => {
          if (!isMounted) return;
          const connected = data.status === "connected";
          setIsConnected(connected);

          // Once the socket is confirmed open, replay any subscriptions that arrived early
          if (connected) {
            clientReadyRef.current = true;
            const pending = pendingSubscriptions.splice(0);
            for (const { event, callback } of pending) {
              globalWSClient?.on(event, callback);
            }
          } else {
            clientReadyRef.current = false;
          }
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
   * If the client isn't ready yet the subscription is queued and replayed
   * as soon as the connection opens — no events are lost.
   */
  const subscribe = (event: string, callback: (data: unknown) => void) => {
    if (globalWSClient && clientReadyRef.current) {
      return globalWSClient.on(event, callback);
    }

    // Queue it for later replay
    const pending: PendingSubscription = { event, callback };
    pendingSubscriptions.push(pending);

    // Return an unsubscribe function that removes from both the queue and the real client
    return () => {
      pendingSubscriptions = pendingSubscriptions.filter((p) => p !== pending);
      globalWSClient?.on(event, callback); // no-op if never registered
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
