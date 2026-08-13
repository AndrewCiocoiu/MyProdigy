package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"myprodigy/backend/internal/models"
)

type HouseholdRepository struct {
	db *DB
}

func NewHouseholdRepository(db *DB) *HouseholdRepository {
	return &HouseholdRepository{db: db}
}

// GetActiveInviteByCreator gets an active (unused and unexpired) invite for a user.
func (r *HouseholdRepository) GetActiveInviteByCreator(ctx context.Context, userID string) (*models.HouseholdInvite, error) {
	query := `
		SELECT id, code, creator_user_id, created_at, expires_at, used_at
		FROM household_invites
		WHERE creator_user_id = $1 AND used_at IS NULL AND expires_at > NOW()
		ORDER BY created_at DESC
		LIMIT 1
	`
	invite := &models.HouseholdInvite{}
	err := r.db.Pool.QueryRow(ctx, query, userID).Scan(
		&invite.ID,
		&invite.Code,
		&invite.CreatorUserID,
		&invite.CreatedAt,
		&invite.ExpiresAt,
		&invite.UsedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed fetching active invite: %w", err)
	}

	return invite, nil
}

// CreateInvite creates a new 5-character invite code for a user.
func (r *HouseholdRepository) CreateInvite(ctx context.Context, userID, code string, expiresAt time.Time) (*models.HouseholdInvite, error) {
	query := `
		INSERT INTO household_invites (code, creator_user_id, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, code, creator_user_id, created_at, expires_at, used_at
	`
	invite := &models.HouseholdInvite{}
	err := r.db.Pool.QueryRow(ctx, query, code, userID, expiresAt).Scan(
		&invite.ID,
		&invite.Code,
		&invite.CreatorUserID,
		&invite.CreatedAt,
		&invite.ExpiresAt,
		&invite.UsedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed creating invite: %w", err)
	}

	return invite, nil
}

// GetInviteByCode finds an active invite code.
func (r *HouseholdRepository) GetInviteByCode(ctx context.Context, code string) (*models.HouseholdInvite, error) {
	query := `
		SELECT id, code, creator_user_id, created_at, expires_at, used_at
		FROM household_invites
		WHERE code = $1 AND used_at IS NULL AND expires_at > NOW()
	`
	invite := &models.HouseholdInvite{}
	err := r.db.Pool.QueryRow(ctx, query, code).Scan(
		&invite.ID,
		&invite.Code,
		&invite.CreatorUserID,
		&invite.CreatedAt,
		&invite.ExpiresAt,
		&invite.UsedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed fetching invite by code: %w", err)
	}

	return invite, nil
}

// JoinAndCreateHousehold atomically creates a partnership between creator and joiner, marks invite as used, and initializes pet & house.
func (r *HouseholdRepository) JoinAndCreateHousehold(ctx context.Context, inviteID, user1ID, user2ID string) (*models.Household, error) {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed beginning transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Mark invite as used
	now := time.Now()
	_, err = tx.Exec(ctx, `UPDATE household_invites SET used_at = $1 WHERE id = $2 AND used_at IS NULL`, now, inviteID)
	if err != nil {
		return nil, fmt.Errorf("failed marking invite used: %w", err)
	}

	// 2. Insert partnership (Hometown city_id = 1)
	household := &models.Household{}
	err = tx.QueryRow(ctx, `
		INSERT INTO partnerships (user1_id, user2_id, current_city_id)
		VALUES ($1, $2, 1)
		RETURNING id, user1_id, user2_id, shared_wood, shared_stone, shared_coins, current_city_id, created_at
	`, user1ID, user2ID).Scan(
		&household.ID,
		&household.User1ID,
		&household.User2ID,
		&household.SharedWood,
		&household.SharedStone,
		&household.SharedCoins,
		&household.CurrentCityID,
		&household.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed creating partnership: %w", err)
	}

	// 3. Initialize default house for Hometown (city_id = 1)
	_, err = tx.Exec(ctx, `
		INSERT INTO houses (partnership_id, city_id, upgrade_tier)
		VALUES ($1, 1, 1)
	`, household.ID)
	if err != nil {
		return nil, fmt.Errorf("failed initializing house: %w", err)
	}

	// 4. Initialize pet for partnership
	_, err = tx.Exec(ctx, `
		INSERT INTO pets (partnership_id, name, health, status)
		VALUES ($1, 'Buddy', 100, 'HEALTHY')
	`, household.ID)
	if err != nil {
		return nil, fmt.Errorf("failed initializing pet: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed committing household transaction: %w", err)
	}

	return household, nil
}

// GetPartnershipByID fetches partnership details by partnership UUID.
func (r *HouseholdRepository) GetPartnershipByID(ctx context.Context, id string) (*models.Household, error) {
	query := `
		SELECT id, user1_id, user2_id, shared_wood, shared_stone, shared_coins, current_city_id, created_at
		FROM partnerships
		WHERE id = $1
	`
	h := &models.Household{}
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&h.ID,
		&h.User1ID,
		&h.User2ID,
		&h.SharedWood,
		&h.SharedStone,
		&h.SharedCoins,
		&h.CurrentCityID,
		&h.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed fetching partnership by id: %w", err)
	}

	return h, nil
}

// LeaveHousehold deletes the partnership (cascading pets/houses) for a user.
func (r *HouseholdRepository) LeaveHousehold(ctx context.Context, userID string) error {
	query := `
		DELETE FROM partnerships
		WHERE user1_id = $1 OR user2_id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed leaving household: %w", err)
	}
	return nil
}


