package repository

import (
	"context"
	"myprodigy/backend/internal/models"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	// Query user details from DB
	return nil, nil
}
