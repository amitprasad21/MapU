package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
	"backend/utils"
)

type VehicleService interface {
	RegisterVehicle(vehicleNumber, driverName, vehicleType, phone string) (*models.Vehicle, error)
	GetAllVehicles() ([]models.Vehicle, error)
	GetVehicleByID(id string) (*models.Vehicle, error)
	UpdateVehicle(id, vehicleNumber, driverName, vehicleType, phone, status string) (*models.Vehicle, error)
	DeleteVehicle(id string) error
}

type vehicleService struct {
	repo repositories.VehicleRepository
}

func NewVehicleService(repo repositories.VehicleRepository) VehicleService {
	return &vehicleService{repo: repo}
}

func (s *vehicleService) RegisterVehicle(vehicleNumber, driverName, vehicleType, phone string) (*models.Vehicle, error) {
	if vehicleNumber == "" {
		return nil, errors.New("vehicle_number is required")
	}
	if driverName == "" {
		return nil, errors.New("driver_name is required")
	}
	if vehicleType == "" {
		return nil, errors.New("vehicle_type is required")
	}
	if phone == "" {
		return nil, errors.New("phone is required")
	}

	vehicle := &models.Vehicle{
		ID:            utils.GenerateID("veh_"),
		VehicleNumber: vehicleNumber,
		DriverName:    driverName,
		VehicleType:   vehicleType,
		Phone:         phone,
		Status:        "active",
	}

	err := s.repo.Create(vehicle)
	if err != nil {
		return nil, err
	}

	return vehicle, nil
}

func (s *vehicleService) GetAllVehicles() ([]models.Vehicle, error) {
	return s.repo.GetAll()
}

func (s *vehicleService) GetVehicleByID(id string) (*models.Vehicle, error) {
	return s.repo.GetByID(id)
}

func (s *vehicleService) UpdateVehicle(id, vehicleNumber, driverName, vehicleType, phone, status string) (*models.Vehicle, error) {
	vehicle, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if vehicleNumber != "" {
		vehicle.VehicleNumber = vehicleNumber
	}
	if driverName != "" {
		vehicle.DriverName = driverName
	}
	if vehicleType != "" {
		vehicle.VehicleType = vehicleType
	}
	if phone != "" {
		vehicle.Phone = phone
	}
	if status != "" {
		vehicle.Status = status
	}

	err = s.repo.Update(vehicle)
	if err != nil {
		return nil, err
	}

	return vehicle, nil
}

func (s *vehicleService) DeleteVehicle(id string) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(id)
}
