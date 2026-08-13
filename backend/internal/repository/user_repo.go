package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"myprodigy/backend/internal/models"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash, displayName string) (*models.User, error) {
	query := `
		INSERT INTO users (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, display_name, personal_wood, personal_stone, personal_coins, created_at
	`
	user := &models.User{}
	err := r.db.Pool.QueryRow(ctx, query, email, passwordHash, displayName).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.DisplayName,
		&user.PersonalWood,
		&user.PersonalStone,
		&user.PersonalCoins,
		&user.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT u.id, u.email, u.password_hash, u.display_name, u.personal_wood, u.personal_stone, u.personal_coins, u.created_at,
		       p.id AS partnership_id
		FROM users u
		LEFT JOIN partnerships p ON p.user1_id = u.id OR p.user2_id = u.id
		WHERE u.email = $1
		LIMIT 1
	`
	user := &models.User{}
	err := r.db.Pool.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.DisplayName,
		&user.PersonalWood,
		&user.PersonalStone,
		&user.PersonalCoins,
		&user.CreatedAt,
		&user.PartnershipID,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query user by email: %w", err)
	}

	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT u.id, u.email, u.password_hash, u.display_name, u.personal_wood, u.personal_stone, u.personal_coins, u.created_at,
		       p.id AS partnership_id
		FROM users u
		LEFT JOIN partnerships p ON p.user1_id = u.id OR p.user2_id = u.id
		WHERE u.id = $1
		LIMIT 1
	`
	user := &models.User{}
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.DisplayName,
		&user.PersonalWood,
		&user.PersonalStone,
		&user.PersonalCoins,
		&user.CreatedAt,
		&user.PartnershipID,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query user by id: %w", err)
	}

	return user, nil
}

