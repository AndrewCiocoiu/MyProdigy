# WebSocket Event Protocol Registry

This document defines the WebSocket events, formats, and magic strings used in the MyProdigy real-time synchronization layer. 

**Rule 3 Compliance:** No magic strings. These names must be declared as string constants in the Go backend (`events.go`) and TypeScript frontend (`events.ts`).

---

## 1. Connection & Presence Events

### `PARTNER_JOINED`
Triggered by the server when Partner B joins the Waiting Room or active session.
* **Sender:** Server
* **Payload:**
  ```json
  {
    "event": "partner_joined",
    "userId": "user-uuid-123",
    "name": "CozyPartner"
  }
  ```

### `PARTNER_LEFT`
Triggered by the server when Partner B disconnects or closes the session tab.
* **Sender:** Server
* **Payload:**
  ```json
  {
    "event": "partner_left",
    "userId": "user-uuid-123",
    "disconnectedAt": "2026-08-12T16:20:00Z"
  }
  ```

---

## 2. Focus Timer Synchronization

### `TIMER_START`
Sent when a partner initiates a session.
* **Sender:** Client -> Server
* **Payload:**
  ```json
  {
    "event": "timer_start",
    "sessionId": "session-uuid",
    "durationMinutes": 25
  }
  ```

### `TIMER_SYNC`
Broadcasted by the server to sync timer status, started at time, and expected end time (UTC).
* **Sender:** Server
* **Payload:**
  ```json
  {
    "event": "timer_sync",
    "sessionId": "session-uuid",
    "status": "session_active",
    "startedAt": "2026-08-12T16:20:00Z",
    "expectedEndAt": "2026-08-12T16:45:00Z"
  }
  ```

### `TIMER_COMPLETE`
Triggered when the expected session time ends.
* **Sender:** Server (Go backend computes final end time state and updates DB)
* **Payload:**
  ```json
  {
    "event": "timer_complete",
    "sessionId": "session-uuid",
    "rewards": {
      "wood": 5,
      "stone": 2,
      "coins": 10
    }
  }
  ```

---

## 3. Presence Pokes

### `POKE_SENT`
Sent by a client when clicking an interaction emoji.
* **Sender:** Client -> Server
* **Payload:**
  ```json
  {
    "event": "poke_sent",
    "emoji": "heart"  // "heart" | "coffee" | "star" | "highfive"
  }
  ```

### `POKE_RECEIVED`
Broadcasted by the server to the partner to trigger a floating pixel emoji animation.
* **Sender:** Server -> Client
* **Payload:**
  ```json
  {
    "event": "poke_received",
    "senderId": "user-uuid-abc",
    "emoji": "heart"
  }
  ```
