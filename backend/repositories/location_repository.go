package repositories

import (
	"backend/models"
	"gorm.io/gorm"
)

type LocationRepository interface {
	Create(location *models.VehicleLocation) error
	GetLatestForVehicle(vehicleID string) (*models.VehicleLocation, error)
	GetLatestForVehicleBefore(vehicleID string, beforeID uint) (*models.VehicleLocation, error)
	GetCurrentLocations() ([]models.VehicleLocation, error)
}

type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) Create(location *models.VehicleLocation) error {
	return r.db.Create(location).Error
}

func (r *locationRepository) GetLatestForVehicle(vehicleID string) (*models.VehicleLocation, error) {
	var location models.VehicleLocation
	err := r.db.Where("vehicle_id = ?", vehicleID).Order("recorded_at desc, id desc").First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

// GetLatestForVehicleBefore gets the latest location recorded before the current location ID (for entry/exit transition check)
func (r *locationRepository) GetLatestForVehicleBefore(vehicleID string, beforeID uint) (*models.VehicleLocation, error) {
	var location models.VehicleLocation
	err := r.db.Where("vehicle_id = ? AND id < ?", vehicleID, beforeID).Order("recorded_at desc, id desc").First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *locationRepository) GetCurrentLocations() ([]models.VehicleLocation, error) {
	var locations []models.VehicleLocation
	// Use DISTINCT ON (vehicle_id) to get the latest location for each vehicle
	err := r.db.Raw(`
		SELECT DISTINCT ON (vehicle_id) id, vehicle_id, latitude, longitude, recorded_at 
		FROM vehicle_locations 
		ORDER BY vehicle_id, recorded_at DESC, id DESC
	`).Scan(&locations).Error
	return locations, err
}
