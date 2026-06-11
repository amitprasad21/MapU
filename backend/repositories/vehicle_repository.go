package repositories

import (
	"backend/models"
	"gorm.io/gorm"
)

type VehicleRepository interface {
	Create(vehicle *models.Vehicle) error
	GetAll() ([]models.Vehicle, error)
	GetByID(id string) (*models.Vehicle, error)
	Update(vehicle *models.Vehicle) error
	Delete(id string) error
}

type vehicleRepository struct {
	db *gorm.DB
}

func NewVehicleRepository(db *gorm.DB) VehicleRepository {
	return &vehicleRepository{db: db}
}

func (r *vehicleRepository) Create(vehicle *models.Vehicle) error {
	return r.db.Create(vehicle).Error
}

func (r *vehicleRepository) GetAll() ([]models.Vehicle, error) {
	var vehicles []models.Vehicle
	err := r.db.Find(&vehicles).Error
	return vehicles, err
}

func (r *vehicleRepository) GetByID(id string) (*models.Vehicle, error) {
	var vehicle models.Vehicle
	err := r.db.First(&vehicle, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (r *vehicleRepository) Update(vehicle *models.Vehicle) error {
	return r.db.Save(vehicle).Error
}

func (r *vehicleRepository) Delete(id string) error {
	return r.db.Delete(&models.Vehicle{}, "id = ?", id).Error
}
