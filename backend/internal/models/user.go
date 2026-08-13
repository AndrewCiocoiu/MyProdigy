package models

import "time"

type User struct {
	ID            string    `json:"id" db:"id"`
	Email         string    `json:"email" db:"email"`
	PasswordHash  string    `json:"-" db:"password_hash"`
	DisplayName   string    `json:"name" db:"display_name"`
	PersonalWood  int       `json:"personalWood" db:"personal_wood"`
	PersonalStone int       `json:"personalStone" db:"personal_stone"`
	PersonalCoins int       `json:"personalCoins" db:"personal_coins"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
	PartnershipID *string   `json:"partnershipId,omitempty" db:"partnership_id"`
}

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	ID            string  `json:"id"`
	Email         string  `json:"email"`
	Name          string  `json:"name"`
	PartnershipID *string `json:"partnershipId,omitempty"`
}

