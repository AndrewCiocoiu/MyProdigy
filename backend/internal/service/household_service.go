package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"myprodigy/backend/internal/models"
	"myprodigy/backend/internal/repository"
	"myprodigy/backend/internal/ws"
)

var (
	ErrAlreadyInHousehold = errors.New("user is already in a household")
	ErrInviteNotFound     = errors.New("invalid or expired 5-digit code")
	ErrCannotJoinOwn      = errors.New("you cannot join your own code")
)

type HouseholdService struct {
	householdRepo *repository.HouseholdRepository
	userRepo      *repository.UserRepository
	hub           *ws.Hub
}

func NewHouseholdService(householdRepo *repository.HouseholdRepository, userRepo *repository.UserRepository, hub *ws.Hub) *HouseholdService {
	return &HouseholdService{
		householdRepo: householdRepo,
		userRepo:      userRepo,
		hub:           hub,
	}
}

func (s *HouseholdService) GetStatus(ctx context.Context, userID string) (*models.HouseholdStatusResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed getting user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	if user.PartnershipID != nil {
		partnerName := ""
		partnerID := ""
		isOnline := false

		partnership, pErr := s.householdRepo.GetPartnershipByID(ctx, *user.PartnershipID)
		if pErr == nil && partnership != nil {
			targetPartnerID := partnership.User1ID
			if targetPartnerID == userID {
				targetPartnerID = partnership.User2ID
			}
			partnerID = targetPartnerID
			partner, uErr := s.userRepo.GetByID(ctx, targetPartnerID)
			if uErr == nil && partner != nil {
				partnerName = partner.DisplayName
			}

			if s.hub != nil {
				isOnline = s.hub.IsUserOnline(*user.PartnershipID, partnerID)
			}
		}

		return &models.HouseholdStatusResponse{
			HasHousehold:    true,
			PartnershipID:   user.PartnershipID,
			PartnerID:       &partnerID,
			PartnerName:     &partnerName,
			IsPartnerOnline: isOnline,
		}, nil
	}

	activeInvite, err := s.householdRepo.GetActiveInviteByCreator(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &models.HouseholdStatusResponse{
		HasHousehold: false,
		ActiveInvite: activeInvite,
	}, nil
}

func (s *HouseholdService) GenerateInviteCode(ctx context.Context, userID string) (*models.HouseholdInvite, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed checking user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	if user.PartnershipID != nil {
		return nil, ErrAlreadyInHousehold
	}

	// Check existing active invite
	existing, err := s.householdRepo.GetActiveInviteByCreator(ctx, userID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	code, err := generate5DigitCode()
	if err != nil {
		return nil, fmt.Errorf("failed generating code: %w", err)
	}

	expiresAt := time.Now().Add(48 * time.Hour)
	invite, err := s.householdRepo.CreateInvite(ctx, userID, code, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed saving invite: %w", err)
	}

	return invite, nil
}

func (s *HouseholdService) JoinHousehold(ctx context.Context, joinerUserID, code string) (*models.Household, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	if len(cleanCode) != 5 {
		return nil, ErrInviteNotFound
	}

	joiner, err := s.userRepo.GetByID(ctx, joinerUserID)
	if err != nil || joiner == nil {
		return nil, fmt.Errorf("invalid joining user")
	}
	if joiner.PartnershipID != nil {
		return nil, ErrAlreadyInHousehold
	}

	invite, err := s.householdRepo.GetInviteByCode(ctx, cleanCode)
	if err != nil {
		return nil, err
	}
	if invite == nil {
		return nil, ErrInviteNotFound
	}

	if invite.CreatorUserID == joinerUserID {
		return nil, ErrCannotJoinOwn
	}

	// Make sure creator is not already in a household
	creator, err := s.userRepo.GetByID(ctx, invite.CreatorUserID)
	if err != nil || creator == nil {
		return nil, fmt.Errorf("creator not found")
	}
	if creator.PartnershipID != nil {
		return nil, errors.New("creator is already in another household")
	}

	household, err := s.householdRepo.JoinAndCreateHousehold(ctx, invite.ID, invite.CreatorUserID, joinerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed joining household: %w", err)
	}

	// Notify both clients via WebSocket that their household has been joined & activated
	if s.hub != nil {
		s.hub.BroadcastToRoom("user:"+invite.CreatorUserID, "household_joined", map[string]interface{}{
			"householdId": household.ID,
		})
		s.hub.BroadcastToRoom("user:"+joinerUserID, "household_joined", map[string]interface{}{
			"householdId": household.ID,
		})
	}

	return household, nil
}

func (s *HouseholdService) LeaveHousehold(ctx context.Context, userID string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return fmt.Errorf("user not found")
	}
	if user.PartnershipID == nil {
		return errors.New("user is not in a household")
	}

	partnershipID := *user.PartnershipID

	if err := s.householdRepo.LeaveHousehold(ctx, userID); err != nil {
		return err
	}

	// Notify room members that the household was disbanded
	if s.hub != nil {
		s.hub.BroadcastToRoom(partnershipID, "household_left", map[string]interface{}{
			"userId": userID,
		})
	}

	return nil
}

func generate5DigitCode() (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing chars I, O, 1, 0
	result := make([]byte, 5)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[num.Int64()]
	}
	return string(result), nil
}
