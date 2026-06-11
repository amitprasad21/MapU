package services

import (
	"time"

	"backend/models"
	"backend/repositories"
)

type ViolationService interface {
	GetViolationHistory(vehicleID, geofenceID string, startDate, endDate *time.Time, limit, offset int) ([]models.Violation, int64, error)
}

type violationService struct {
	repo repositories.ViolationRepository
}

func NewViolationService(repo repositories.ViolationRepository) ViolationService {
	return &violationService{repo: repo}
}

func (s *violationService) GetViolationHistory(vehicleID, geofenceID string, startDate, endDate *time.Time, limit, offset int) ([]models.Violation, int64, error) {
	return s.repo.GetHistory(vehicleID, geofenceID, startDate, endDate, limit, offset)
}
