package service

// HouseService handles upgrading the home and relocating cities.
type HouseService struct {
	// dependencies like repositories can be injected here
}

func NewHouseService() *HouseService {
	return &HouseService{}
}
