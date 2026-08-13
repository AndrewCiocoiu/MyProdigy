export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 2000; // 2 seconds
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  public get isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Append token as query parameter for Auth Interception (Go Handlers/Middleware verification)
    const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("[WS] Connected successfully");
      this.reconnectAttempts = 0;
      this.emit("status_change", { status: "connected" });
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event) {
          this.emit(message.event, message.data);
        }
      } catch (err) {
        console.error("[WS] Error parsing message:", err);
      }
    };

    this.socket.onclose = (event) => {
      console.log("[WS] Connection closed:", event.reason);
      this.emit("status_change", { status: "disconnected" });
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error("[WS] Connection error:", error);
      this.emit("status_change", { status: "error", error });
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[WS] Max reconnect attempts reached, retrying later...");
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect();
      }, 5000);
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting attempt ${this.reconnectAttempts}...`);
    setTimeout(() => this.connect(), this.reconnectInterval);
  }

  send(event: string, data: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("[WS] Cannot send message, socket not open");
      return;
    }

    this.socket.send(JSON.stringify({ event, data }));
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[WS] Error calling listener for event ${event}:`, err);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
