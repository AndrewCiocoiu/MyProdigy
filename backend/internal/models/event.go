package models

// WebSocket Event Constants to satisfy Rule 3 (No Magic Strings)
const (
	EventPartnerJoined = "partner_joined"
	EventPartnerLeft   = "partner_left"
	EventTimerStart    = "timer_start"
	EventTimerSync     = "timer_sync"
	EventTimerComplete = "timer_complete"
	EventPokeSent      = "poke_sent"
	EventPokeReceived  = "poke_received"
)
