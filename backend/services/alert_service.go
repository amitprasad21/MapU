package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
	"backend/utils"
)

type AlertService interface {
	ConfigureAlert(geofenceID, vehicleID, eventType string) (*models.AlertRule, error)
	GetAllAlertRules(geofenceID, vehicleID string) ([]models.AlertRule, error)
	GetAlertRuleByID(id string) (*models.AlertRule, error)
	DeleteAlertRule(id string) error
}

type alertService struct {
	repo        repositories.AlertRepository
	geofenceRepo repositories.GeofenceRepository
	vehicleRepo  repositories.VehicleRepository
}

func NewAlertService(repo repositories.AlertRepository, geofenceRepo repositories.GeofenceRepository, vehicleRepo repositories.VehicleRepository) AlertService {
	return &alertService{
		repo:         repo,
		geofenceRepo: geofenceRepo,
		vehicleRepo:  vehicleRepo,
	}
}

func (s *alertService) ConfigureAlert(geofenceID, vehicleID, eventType string) (*models.AlertRule, error) {
	if geofenceID == "" {
		return nil, errors.New("geofence_id is required")
	}
	if eventType != "entry" && eventType != "exit" && eventType != "both" {
		return nil, errors.New("event_type must be one of: 'entry', 'exit', 'both'")
	}

	// Verify geofence exists
	_, err := s.geofenceRepo.GetByID(geofenceID)
	if err != nil {
		return nil, errors.New("geofence not found")
	}

	// Verify vehicle exists if vehicleID is provided
	var vID *string
	if vehicleID != "" {
		_, err = s.vehicleRepo.GetByID(vehicleID)
		if err != nil {
			return nil, errors.New("vehicle not found")
		}
		vID = &vehicleID
	}

	rule := &models.AlertRule{
		ID:         utils.GenerateID("alert_"),
		GeofenceID: geofenceID,
		VehicleID:  vID,
		EventType:  eventType,
		Status:     "active",
	}

	err = s.repo.Create(rule)
	if err != nil {
		return nil, err
	}

	// Fetch rule again to preload Geofence and Vehicle details for the response
	return s.repo.GetByID(rule.ID)
}

func (s *alertService) GetAllAlertRules(geofenceID, vehicleID string) ([]models.AlertRule, error) {
	return s.repo.GetAll(geofenceID, vehicleID)
}

func (s *alertService) GetAlertRuleByID(id string) (*models.AlertRule, error) {
	return s.repo.GetByID(id)
}

func (s *alertService) DeleteAlertRule(id string) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(id)
}
