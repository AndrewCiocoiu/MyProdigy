package models

import "time"

type Household struct {
	ID            string    `json:"id" db:"id"`
	User1ID       string    `json:"user1Id" db:"user1_id"`
	User2ID       string    `json:"user2Id" db:"user2_id"`
	SharedWood    int       `json:"sharedWood" db:"shared_wood"`
	SharedStone   int       `json:"sharedStone" db:"shared_stone"`
	SharedCoins   int       `json:"sharedCoins" db:"shared_coins"`
	CurrentCityID int       `json:"currentCityId" db:"current_city_id"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
}

type HouseholdInvite struct {
	ID            string     `json:"id" db:"id"`
	Code          string     `json:"code" db:"code"`
	CreatorUserID string     `json:"creatorUserId" db:"creator_user_id"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
	ExpiresAt     time.Time  `json:"expiresAt" db:"expires_at"`
	UsedAt        *time.Time `json:"usedAt,omitempty" db:"used_at"`
}

type JoinHouseholdRequest struct {
	Code string `json:"code"`
}

type HouseholdStatusResponse struct {
	HasHousehold    bool             `json:"hasHousehold"`
	PartnershipID   *string          `json:"partnershipId,omitempty"`
	ActiveInvite    *HouseholdInvite `json:"activeInvite,omitempty"`
	PartnerID       *string          `json:"partnerId,omitempty"`
	PartnerName     *string          `json:"partnerName,omitempty"`
	IsPartnerOnline bool             `json:"isPartnerOnline"`
}
