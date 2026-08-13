package repository

import (
	"context"
	"fmt"
	"time"

	"myprodigy/backend/internal/models"
)

type SessionRepository struct {
	db *DB
}

func NewSessionRepository(db *DB) *SessionRepository {
	return &SessionRepository{db: db}
}

// LogFocusSession logs a completed or aborted session to the database and rewards players atomically.
func (r *SessionRepository) LogFocusSession(
	ctx context.Context,
	partnershipID string,
	userID *string,
	sessionType string,
	durationMins int,
	status string,
	startedAt, endedAt time.Time,
) error {
	if r.db == nil || r.db.Pool == nil {
		return nil
	}

	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed starting focus session transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Ensure duration is at least 1 min for DB constraint
	if durationMins < 1 {
		durationMins = 1
	}

	// 1. Insert into focus_sessions table
	insertQuery := `
		INSERT INTO focus_sessions (partnership_id, user_id, session_type, duration_mins, status, started_at, ended_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.Exec(ctx, insertQuery, partnershipID, userID, sessionType, durationMins, status, startedAt, endedAt)
	if err != nil {
		return fmt.Errorf("failed logging focus session: %w", err)
	}

	// 2. If completed joint session, award shared resources and refresh pet interaction atomically
	if status == "COMPLETED" && sessionType == "JOINT" {
		// Calculate resource payout based on duration: ~1 wood, 1 stone, 2 coins per 5 mins
		woodEarned := (durationMins / 5) * 2
		stoneEarned := (durationMins / 5) * 1
		coinsEarned := (durationMins / 5) * 5
		if woodEarned < 2 {
			woodEarned = 2
		}
		if stoneEarned < 1 {
			stoneEarned = 1
		}
		if coinsEarned < 5 {
			coinsEarned = 5
		}

		updatePartnershipQuery := `
			UPDATE partnerships
			SET shared_wood = shared_wood + $1,
			    shared_stone = shared_stone + $2,
			    shared_coins = shared_coins + $3
			WHERE id = $4
		`
		_, err = tx.Exec(ctx, updatePartnershipQuery, woodEarned, stoneEarned, coinsEarned, partnershipID)
		if err != nil {
			return fmt.Errorf("failed updating partnership resources: %w", err)
		}

		// Update pet health & last_joint_session
		updatePetQuery := `
			UPDATE pets
			SET last_joint_session = $1,
			    health = LEAST(100, health + 10),
			    status = 'HEALTHY'
			WHERE partnership_id = $2
		`
		_, err = tx.Exec(ctx, updatePetQuery, endedAt, partnershipID)
		if err != nil {
			return fmt.Errorf("failed updating pet after joint session: %w", err)
		}
	}

	return tx.Commit(ctx)
}

// GetHouseholdSessionHistory fetches all logged sessions for a household and calculates summary metrics.
func (r *SessionRepository) GetHouseholdSessionHistory(
	ctx context.Context,
	partnershipID string,
	limit, offset int,
) ([]*models.FocusSessionHistoryItem, *models.FocusSessionHistorySummary, int, error) {
	if r.db == nil || r.db.Pool == nil {
		return []*models.FocusSessionHistoryItem{}, &models.FocusSessionHistorySummary{}, 0, nil
	}

	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	// 1. Fetch paginated session rows
	query := `
		SELECT 
			fs.id,
			fs.partnership_id,
			fs.user_id,
			u.display_name,
			fs.session_type,
			fs.duration_mins,
			fs.status,
			fs.started_at,
			fs.ended_at
		FROM focus_sessions fs
		LEFT JOIN users u ON fs.user_id = u.id
		WHERE fs.partnership_id = $1
		ORDER BY fs.started_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Pool.Query(ctx, query, partnershipID, limit, offset)
	if err != nil {
		return nil, nil, 0, fmt.Errorf("failed querying focus sessions history: %w", err)
	}
	defer rows.Close()

	sessions := make([]*models.FocusSessionHistoryItem, 0)
	for rows.Next() {
		item := &models.FocusSessionHistoryItem{}
		err := rows.Scan(
			&item.ID,
			&item.HouseholdID,
			&item.UserID,
			&item.UserName,
			&item.SessionType,
			&item.DurationMins,
			&item.Status,
			&item.StartedAt,
			&item.EndedAt,
		)
		if err != nil {
			return nil, nil, 0, fmt.Errorf("failed scanning focus session row: %w", err)
		}
		sessions = append(sessions, item)
	}

	// 2. Fetch summary metrics
	summaryQuery := `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'COMPLETED'),
			COUNT(*) FILTER (WHERE status = 'ABORTED'),
			COALESCE(SUM(duration_mins) FILTER (WHERE status = 'COMPLETED'), 0),
			COUNT(*) FILTER (WHERE session_type = 'JOINT'),
			COUNT(*) FILTER (WHERE session_type = 'SOLO')
		FROM focus_sessions
		WHERE partnership_id = $1
	`
	summary := &models.FocusSessionHistorySummary{}
	var totalCount int
	err = r.db.Pool.QueryRow(ctx, summaryQuery, partnershipID).Scan(
		&totalCount,
		&summary.CompletedSessions,
		&summary.AbortedSessions,
		&summary.TotalFocusMinutes,
		&summary.JointSessions,
		&summary.SoloSessions,
	)
	if err != nil {
		return nil, nil, 0, fmt.Errorf("failed calculating focus session summary: %w", err)
	}
	summary.TotalSessions = totalCount

	return sessions, summary, totalCount, nil
}
