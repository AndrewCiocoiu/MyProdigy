// WebSocket Event Constants to satisfy Rule 3 (No Magic Strings)
export const WS_EVENTS = {
  PARTNER_JOINED: "partner_joined",
  PARTNER_LEFT: "partner_left",
  TIMER_START: "timer_start",
  TIMER_SYNC: "timer_sync",
  TIMER_COMPLETE: "timer_complete",
  POKE_SENT: "poke_sent",
  POKE_RECEIVED: "poke_received",
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];
