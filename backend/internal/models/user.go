package models

import "time"

type User struct {
	ID          string     `json:"id" db:"id"`
	Email       string     `json:"email" db:"email"`
	Name        string     `json:"name" db:"name"`
	HouseholdID *string    `json:"householdId,omitempty" db:"household_id"`
	Role        string     `json:"role" db:"role"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
}
