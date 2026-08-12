package service

// PetService manages virtual pet states, decay calculations, and rescue missions.
type PetService struct {
	// dependencies like repositories can be injected here
}

func NewPetService() *PetService {
	return &PetService{}
}
