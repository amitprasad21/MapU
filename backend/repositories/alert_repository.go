package repositories

import (
	"backend/models"
	"gorm.io/gorm"
)

type AlertRepository interface {
	Create(rule *models.AlertRule) error
	GetAll(geofenceID, vehicleID string) ([]models.AlertRule, error)
	GetByID(id string) (*models.AlertRule, error)
	Delete(id string) error
	GetMatchingRules(geofenceID, vehicleID, eventType string) ([]models.AlertRule, error)
}

type alertRepository struct {
	db *gorm.DB
}

func NewAlertRepository(db *gorm.DB) AlertRepository {
	return &alertRepository{db: db}
}

func (r *alertRepository) Create(rule *models.AlertRule) error {
	return r.db.Create(rule).Error
}

func (r *alertRepository) GetAll(geofenceID, vehicleID string) ([]models.AlertRule, error) {
	var rules []models.AlertRule
	query := r.db.Preload("Geofence").Preload("Vehicle")

	if geofenceID != "" {
		query = query.Where("geofence_id = ?", geofenceID)
	}
	if vehicleID != "" {
		query = query.Where("vehicle_id = ?", vehicleID)
	}

	err := query.Find(&rules).Error
	return rules, err
}

func (r *alertRepository) GetByID(id string) (*models.AlertRule, error) {
	var rule models.AlertRule
	err := r.db.Preload("Geofence").Preload("Vehicle").First(&rule, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *alertRepository) Delete(id string) error {
	return r.db.Delete(&models.AlertRule{}, "id = ?", id).Error
}

func (r *alertRepository) GetMatchingRules(geofenceID, vehicleID, eventType string) ([]models.AlertRule, error) {
	var rules []models.AlertRule
	// Match rule if geofence_id matches, and it is active, AND
	// (vehicle_id matches or is null), AND
	// (event_type matches or is 'both')
	err := r.db.Preload("Geofence").Preload("Vehicle").
		Where("geofence_id = ? AND status = 'active' AND (vehicle_id = ? OR vehicle_id IS NULL) AND (event_type = ? OR event_type = 'both')",
			geofenceID, vehicleID, eventType).
		Find(&rules).Error
	return rules, err
}
