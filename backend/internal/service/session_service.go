package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"sync"
	"time"

	"myprodigy/backend/internal/models"
	"myprodigy/backend/internal/repository"
	"myprodigy/backend/internal/ws"
)

const (
	// MinimumSessionDuration is the minimum allowed focus timer duration in minutes.
	// NOTE: In production this is 15. Set to 2 minutes for testing as requested.
	MinimumSessionDuration = 2

	// JoinLobbyWindow is the time allowed for the second partner to join a started session.
	// NOTE: In production this is 10 * time.Minute. Set to 1 * time.Minute for quick testing.
	JoinLobbyWindow = 1 * time.Minute
)

var (
	ErrDurationTooShort     = errors.New("focus session must be at least 2 minutes")
	ErrNotInHousehold       = errors.New("user is not part of a household")
	ErrSessionInProgress    = errors.New("a focus session is already in progress for your household")
	ErrNoActiveSession      = errors.New("no active focus session found")
	ErrLobbyExpired         = errors.New("join window has expired; you can no longer join this session")
	ErrAlreadyParticipating = errors.New("user is already participating in this session")
)

type SessionService struct {
	sessionRepo   *repository.SessionRepository
	householdRepo *repository.HouseholdRepository
	userRepo      *repository.UserRepository
	hub           *ws.Hub

	// Thread-safe in-memory store for active sessions keyed by HouseholdID
	sessionsMu     sync.RWMutex
	activeSessions map[string]*models.ActiveSession
}

func NewSessionService(
	sessionRepo *repository.SessionRepository,
	householdRepo *repository.HouseholdRepository,
	userRepo *repository.UserRepository,
	hub *ws.Hub,
) *SessionService {
	return &SessionService{
		sessionRepo:    sessionRepo,
		householdRepo:  householdRepo,
		userRepo:       userRepo,
		hub:            hub,
		activeSessions: make(map[string]*models.ActiveSession),
	}
}

// StartSession initiates a new focus session lobby with a minimum of 2 minutes (test mode).
func (s *SessionService) StartSession(ctx context.Context, userID string, req models.StartSessionRequest) (*models.ActiveSession, error) {
	if req.DurationMinutes < MinimumSessionDuration {
		return nil, ErrDurationTooShort
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}

	if user.PartnershipID == nil {
		return nil, ErrNotInHousehold
	}

	householdID := *user.PartnershipID

	s.sessionsMu.Lock()
	defer s.sessionsMu.Unlock()

	// Check if there is an active session ongoing
	if existing, ok := s.activeSessions[householdID]; ok {
		now := time.Now().UTC()
		if now.Before(existing.ExpectedEndAt) && existing.Status != "completed" && existing.Status != "aborted" {
			return nil, ErrSessionInProgress
		}
	}

	now := time.Now().UTC()
	sessionID := generateUUID()
	expectedEnd := now.Add(time.Duration(req.DurationMinutes) * time.Minute)
	lobbyExpires := now.Add(JoinLobbyWindow)

	sessionType := "JOINT"
	if req.SessionType == "SOLO" {
		sessionType = "SOLO"
	}

	activeSession := &models.ActiveSession{
		ID:              sessionID,
		HouseholdID:     householdID,
		CreatorUserID:   userID,
		CreatorName:     user.DisplayName,
		SessionType:     sessionType,
		DurationMinutes: req.DurationMinutes,
		StartedAt:       now,
		ExpectedEndAt:   expectedEnd,
		LobbyExpiresAt:  lobbyExpires,
		Status:          "waiting_for_partner",
		ParticipantIDs:  []string{userID},
	}

	s.activeSessions[householdID] = activeSession

	// Schedule automatic completion when expectedEndAt is reached
	durationToWait := expectedEnd.Sub(now)
	time.AfterFunc(durationToWait, func() {
		s.completeSessionIfActive(householdID, sessionID)
	})

	// Broadcast timer_start over WebSocket to room
	if s.hub != nil {
		s.hub.BroadcastToRoom(householdID, models.EventTimerStart, activeSession)
	}

	return activeSession, nil
}

// JoinSession allows the second partner in the household to join within the lobby window.
func (s *SessionService) JoinSession(ctx context.Context, userID string) (*models.ActiveSession, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}

	if user.PartnershipID == nil {
		return nil, ErrNotInHousehold
	}

	householdID := *user.PartnershipID

	s.sessionsMu.Lock()
	defer s.sessionsMu.Unlock()

	activeSession, ok := s.activeSessions[householdID]
	if !ok {
		return nil, ErrNoActiveSession
	}

	now := time.Now().UTC()
	if activeSession.Status == "completed" || activeSession.Status == "aborted" || now.After(activeSession.ExpectedEndAt) {
		return nil, errors.New("the session has already ended")
	}

	// Check if already in participants
	for _, pID := range activeSession.ParticipantIDs {
		if pID == userID {
			return nil, ErrAlreadyParticipating
		}
	}

	// Check if the join window has expired
	if now.After(activeSession.LobbyExpiresAt) {
		activeSession.Status = "solo_active"
		return nil, ErrLobbyExpired
	}

	// Successfully join session
	activeSession.ParticipantIDs = append(activeSession.ParticipantIDs, userID)
	activeSession.Status = "session_active"
	activeSession.SessionType = "JOINT"

	// Broadcast timer_sync over WebSocket to room so both clients sync
	if s.hub != nil {
		s.hub.BroadcastToRoom(householdID, models.EventTimerSync, activeSession)
	}

	return activeSession, nil
}

// EndSession cancels or ends an active session. If one partner ends it, it ends for both.
func (s *SessionService) EndSession(ctx context.Context, userID string) (*models.ActiveSession, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}

	if user.PartnershipID == nil {
		return nil, ErrNotInHousehold
	}

	householdID := *user.PartnershipID

	s.sessionsMu.Lock()
	activeSession, ok := s.activeSessions[householdID]
	if !ok {
		s.sessionsMu.Unlock()
		return nil, ErrNoActiveSession
	}

	now := time.Now().UTC()
	status := "aborted"
	if now.After(activeSession.ExpectedEndAt) {
		status = "completed"
	}

	activeSession.Status = status
	delete(s.activeSessions, householdID)
	s.sessionsMu.Unlock()

	// Persist to database
	durationElapsed := int(now.Sub(activeSession.StartedAt).Minutes())
	if durationElapsed < 1 {
		durationElapsed = 1
	}
	dbStatus := "ABORTED"
	if status == "completed" {
		dbStatus = "COMPLETED"
		durationElapsed = activeSession.DurationMinutes
	}

	// Determine final sessionType (JOINT if >= 2 participants, SOLO if 1)
	finalType := "SOLO"
	if len(activeSession.ParticipantIDs) >= 2 {
		finalType = "JOINT"
	}

	creatorID := activeSession.CreatorUserID

	if s.sessionRepo != nil {
		_ = s.sessionRepo.LogFocusSession(
			ctx,
			householdID,
			&creatorID,
			finalType,
			durationElapsed,
			dbStatus,
			activeSession.StartedAt,
			now,
		)
	}

	// Broadcast session_ended & timer_complete to room so both clients exit timer
	if s.hub != nil {
		payload := map[string]interface{}{
			"sessionId": activeSession.ID,
			"status":    status,
			"endedBy":   user.DisplayName,
			"endedById": userID,
		}
		s.hub.BroadcastToRoom(householdID, models.EventSessionEnded, payload)
		s.hub.BroadcastToRoom(householdID, models.EventTimerComplete, payload)
	}

	return activeSession, nil
}

// completeSessionIfActive is called automatically by a timer when expectedEndAt arrives.
func (s *SessionService) completeSessionIfActive(householdID, sessionID string) {
	s.sessionsMu.Lock()
	activeSession, ok := s.activeSessions[householdID]
	if !ok || activeSession.ID != sessionID {
		s.sessionsMu.Unlock()
		return
	}
	if activeSession.Status == "completed" || activeSession.Status == "aborted" {
		s.sessionsMu.Unlock()
		return
	}

	activeSession.Status = "completed"
	delete(s.activeSessions, householdID)
	s.sessionsMu.Unlock()

	finalType := "SOLO"
	if len(activeSession.ParticipantIDs) >= 2 {
		finalType = "JOINT"
	}
	creatorID := activeSession.CreatorUserID

	// Persist completion in DB & award resources atomically
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if s.sessionRepo != nil {
		_ = s.sessionRepo.LogFocusSession(
			ctx,
			householdID,
			&creatorID,
			finalType,
			activeSession.DurationMinutes,
			"COMPLETED",
			activeSession.StartedAt,
			activeSession.ExpectedEndAt,
		)
	}

	// Broadcast timer_complete to room so both clients celebrate and exit timer
	if s.hub != nil {
		payload := map[string]interface{}{
			"sessionId": activeSession.ID,
			"status":    "completed",
			"message":   "Focus sprint completed successfully! Rewards added to shared inventory.",
		}
		s.hub.BroadcastToRoom(householdID, models.EventTimerComplete, payload)
		s.hub.BroadcastToRoom(householdID, models.EventSessionEnded, payload)
	}
}

// GetCurrentSession returns the currently active session for a household if one exists.
func (s *SessionService) GetCurrentSession(ctx context.Context, userID string) (*models.ActiveSession, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}

	if user.PartnershipID == nil {
		return nil, nil
	}

	householdID := *user.PartnershipID

	s.sessionsMu.Lock()
	defer s.sessionsMu.Unlock()

	activeSession, ok := s.activeSessions[householdID]
	if !ok {
		return nil, nil
	}

	now := time.Now().UTC()

	// Check if session has exceeded expectedEndAt
	if now.After(activeSession.ExpectedEndAt) {
		activeSession.Status = "completed"
		delete(s.activeSessions, householdID)

		finalType := "SOLO"
		if len(activeSession.ParticipantIDs) >= 2 {
			finalType = "JOINT"
		}
		creatorID := activeSession.CreatorUserID

		if s.sessionRepo != nil {
			_ = s.sessionRepo.LogFocusSession(
				ctx,
				householdID,
				&creatorID,
				finalType,
				activeSession.DurationMinutes,
				"COMPLETED",
				activeSession.StartedAt,
				activeSession.ExpectedEndAt,
			)
		}
		return nil, nil
	}

	// Check if waiting_for_partner lobby window expired
	if activeSession.Status == "waiting_for_partner" && now.After(activeSession.LobbyExpiresAt) {
		activeSession.Status = "solo_active"
	}

	return activeSession, nil
}

// GetSessionHistory returns the full session history and aggregated metrics for the household.
func (s *SessionService) GetSessionHistory(ctx context.Context, userID string, limit, offset int) (*models.FocusSessionHistoryResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}

	if user.PartnershipID == nil {
		return nil, ErrNotInHousehold
	}

	householdID := *user.PartnershipID

	sessions, summary, total, err := s.sessionRepo.GetHouseholdSessionHistory(ctx, householdID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed fetching session history: %w", err)
	}

	return &models.FocusSessionHistoryResponse{
		Sessions: sessions,
		Summary:  *summary,
		Total:    total,
	}, nil
}

func generateUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
