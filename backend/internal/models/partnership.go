package models

import "time"

type Pet struct {
	ID                string    `json:"id" db:"id"`
	HouseholdID       string    `json:"householdId" db:"household_id"`
	Name              string    `json:"name" db:"name"`
	Level             int       `json:"level" db:"level"`
	Experience        int       `json:"experience" db:"experience"`
	Status            string    `json:"status" db:"status"` // "healthy", "sick", "missing"
	LastInteractionAt time.Time `json:"lastInteractionAt" db:"last_interaction_at"`
}

type SoloSession struct {
	ID              string    `json:"id" db:"id"`
	UserID          string    `json:"userId" db:"user_id"`
	StartedAt       time.Time `json:"startedAt" db:"started_at"`
	ExpectedEndAt   time.Time `json:"expectedEndAt" db:"expected_end_at"`
	Status          string    `json:"status" db:"status"` // "active", "completed", "abandoned"
	DurationMinutes int       `json:"durationMinutes" db:"duration_minutes"`
}

type JointSession struct {
	ID              string    `json:"id" db:"id"`
	HouseholdID     string    `json:"householdId" db:"household_id"`
	StartedAt       time.Time `json:"startedAt" db:"started_at"`
	ExpectedEndAt   time.Time `json:"expectedEndAt" db:"expected_end_at"`
	Status          string    `json:"status" db:"status"` // "waiting_for_partner", "session_active", "completed", "abandoned"
	DurationMinutes int       `json:"durationMinutes" db:"duration_minutes"`
}

type ActiveSession struct {
	ID              string    `json:"id"`
	HouseholdID     string    `json:"householdId"`
	CreatorUserID   string    `json:"creatorUserId"`
	CreatorName     string    `json:"creatorName"`
	SessionType     string    `json:"sessionType"` // "JOINT" or "SOLO"
	DurationMinutes int       `json:"durationMinutes"`
	StartedAt       time.Time `json:"startedAt"`
	ExpectedEndAt   time.Time `json:"expectedEndAt"`
	LobbyExpiresAt  time.Time `json:"lobbyExpiresAt"`
	Status          string    `json:"status"` // "waiting_for_partner", "session_active", "solo_active", "completed", "aborted"
	ParticipantIDs  []string  `json:"participantIds"`
}

type StartSessionRequest struct {
	DurationMinutes int    `json:"durationMinutes"`
	SessionType     string `json:"sessionType"` // "JOINT" or "SOLO"
}

type EndSessionRequest struct {
	Status string `json:"status,omitempty"` // "aborted" or "completed"
}

type FocusSessionHistoryItem struct {
	ID           string    `json:"id" db:"id"`
	HouseholdID  string    `json:"householdId" db:"partnership_id"`
	UserID       *string   `json:"userId,omitempty" db:"user_id"`
	UserName     *string   `json:"userName,omitempty" db:"user_name"`
	SessionType  string    `json:"sessionType" db:"session_type"` // "JOINT", "SOLO", "RESCUE"
	DurationMins int       `json:"durationMins" db:"duration_mins"`
	Status       string    `json:"status" db:"status"` // "COMPLETED" or "ABORTED"
	StartedAt    time.Time `json:"startedAt" db:"started_at"`
	EndedAt      time.Time `json:"endedAt" db:"ended_at"`
}

type FocusSessionHistorySummary struct {
	TotalSessions     int `json:"totalSessions"`
	CompletedSessions int `json:"completedSessions"`
	AbortedSessions   int `json:"abortedSessions"`
	TotalFocusMinutes int `json:"totalFocusMinutes"`
	JointSessions     int `json:"jointSessions"`
	SoloSessions      int `json:"soloSessions"`
}

type FocusSessionHistoryResponse struct {
	Sessions []*FocusSessionHistoryItem   `json:"sessions"`
	Summary  FocusSessionHistorySummary   `json:"summary"`
	Total    int                          `json:"total"`
}

type PorchDropoff struct {
	ID          string    `json:"id" db:"id"`
	SenderID    string    `json:"senderId" db:"sender_id"`
	RecipientID string    `json:"recipientId" db:"recipient_id"`
	Wood        int       `json:"wood" db:"wood"`
	Stone       int       `json:"stone" db:"stone"`
	Coins       int       `json:"coins" db:"coins"`
	Message     string    `json:"message,omitempty" db:"message"`
	IsRead      bool      `json:"isRead" db:"is_read"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
}
