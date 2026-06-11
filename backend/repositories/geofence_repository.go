package repositories

import (
	"backend/models"
	"gorm.io/gorm"
)

type GeofenceRepository interface {
	Create(geofence *models.Geofence) error
	GetAll(category string) ([]models.Geofence, error)
	GetByID(id string) (*models.Geofence, error)
	Update(geofence *models.Geofence) error
	Delete(id string) error
}

type geofenceRepository struct {
	db *gorm.DB
}

func NewGeofenceRepository(db *gorm.DB) GeofenceRepository {
	return &geofenceRepository{db: db}
}

func (r *geofenceRepository) Create(geofence *models.Geofence) error {
	return r.db.Create(geofence).Error
}

func (r *geofenceRepository) GetAll(category string) ([]models.Geofence, error) {
	var geofences []models.Geofence
	query := r.db
	if category != "" {
		query = query.Where("category = ?", category)
	}
	err := query.Find(&geofences).Error
	return geofences, err
}

func (r *geofenceRepository) GetByID(id string) (*models.Geofence, error) {
	var geofence models.Geofence
	err := r.db.First(&geofence, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &geofence, nil
}

func (r *geofenceRepository) Update(geofence *models.Geofence) error {
	return r.db.Save(geofence).Error
}

func (r *geofenceRepository) Delete(id string) error {
	return r.db.Delete(&models.Geofence{}, "id = ?", id).Error
}
