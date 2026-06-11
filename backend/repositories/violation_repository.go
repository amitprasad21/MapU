package repositories

import (
	"time"

	"backend/models"
	"gorm.io/gorm"
)

type ViolationRepository interface {
	Create(violation *models.Violation) error
	GetHistory(vehicleID, geofenceID string, startDate, endDate *time.Time, limit, offset int) ([]models.Violation, int64, error)
	GetTodayCount() (int64, error)
}

type violationRepository struct {
	db *gorm.DB
}

func NewViolationRepository(db *gorm.DB) ViolationRepository {
	return &violationRepository{db: db}
}

func (r *violationRepository) Create(violation *models.Violation) error {
	return r.db.Create(violation).Error
}

func (r *violationRepository) GetHistory(vehicleID, geofenceID string, startDate, endDate *time.Time, limit, offset int) ([]models.Violation, int64, error) {
	var violations []models.Violation
	var totalCount int64

	query := r.db.Model(&models.Violation{}).Preload("Vehicle").Preload("Geofence")

	if vehicleID != "" {
		query = query.Where("vehicle_id = ?", vehicleID)
	}
	if geofenceID != "" {
		query = query.Where("geofence_id = ?", geofenceID)
	}
	if startDate != nil {
		query = query.Where("timestamp >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("timestamp <= ?", *endDate)
	}

	// Count total records matching filters
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// Paginate and order by newest first
	err := query.Order("timestamp desc, id desc").
		Limit(limit).
		Offset(offset).
		Find(&violations).Error

	return violations, totalCount, err
}

func (r *violationRepository) GetTodayCount() (int64, error) {
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	err := r.db.Model(&models.Violation{}).
		Where("timestamp >= ?", today).
		Count(&count).Error
	return count, err
}
