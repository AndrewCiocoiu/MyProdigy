// WebSocket Event Constants to satisfy Rule 3 (No Magic Strings)
export const WS_EVENTS = {
  PARTNER_JOINED: "partner_joined",
  PARTNER_LEFT: "partner_left",
  PRESENCE_STATE: "presence_state",
  TIMER_START: "timer_start",
  TIMER_SYNC: "timer_sync",
  TIMER_COMPLETE: "timer_complete",
  SESSION_ENDED: "session_ended",
  POKE_SENT: "poke_sent",
  POKE_RECEIVED: "poke_received",
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];
