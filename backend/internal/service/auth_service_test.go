package service_test

import (
	"context"
	"testing"

	"myprodigy/backend/internal/models"
	"myprodigy/backend/internal/service"
)

func TestAuthService_Validation(t *testing.T) {
	svc := service.NewAuthService(nil)

	// Test invalid email format
	_, err := svc.Register(context.Background(), models.RegisterRequest{
		Email:    "invalid-email",
		Password: "password123",
	})
	if err == nil {
		t.Errorf("expected error for invalid email, got nil")
	}

	// Test short password
	_, err = svc.Register(context.Background(), models.RegisterRequest{
		Email:    "test@example.com",
		Password: "123",
	})
	if err == nil {
		t.Errorf("expected error for short password, got nil")
	}
}
