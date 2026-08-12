package service

// SessionService manages the business logic for focus sessions (solo and joint).
type SessionService struct {
	// dependencies like repositories can be injected here
}

func NewSessionService() *SessionService {
	return &SessionService{}
}
