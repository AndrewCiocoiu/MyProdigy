"use client";

import { useEffect, useState, useRef, createContext, useContext } from "react";

interface WebSocketContextType {
  isConnected: boolean;
  sendEvent: (eventType: string, payload: any) => void;
  lastMessage: any | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    // Return dummy client if used outside provider for now
    return {
      isConnected: false,
      sendEvent: () => {},
      lastMessage: null,
    };
  }
  return context;
}

// In-memory state and provider logic
// Note: We can implement WebSocketProvider wrapper here
