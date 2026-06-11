package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
	"backend/utils"
)

type GeofenceService interface {
	CreateGeofence(name, description, category string, coordinates [][]float64) (*models.Geofence, error)
	GetAllGeofences(category string) ([]models.Geofence, error)
	GetGeofenceByID(id string) (*models.Geofence, error)
	UpdateGeofence(id, name, description, category string, coordinates [][]float64) (*models.Geofence, error)
	DeleteGeofence(id string) error
}

type geofenceService struct {
	repo repositories.GeofenceRepository
}

func NewGeofenceService(repo repositories.GeofenceRepository) GeofenceService {
	return &geofenceService{repo: repo}
}

func (s *geofenceService) CreateGeofence(name, description, category string, coordinates [][]float64) (*models.Geofence, error) {
	if name == "" {
		return nil, errors.New("name is required")
	}
	if category == "" {
		return nil, errors.New("category is required")
	}

	// Validate polygon coordinates
	err := utils.ValidatePolygon(coordinates)
	if err != nil {
		return nil, err
	}

	geofence := &models.Geofence{
		ID:          utils.GenerateID("geo_"),
		Name:        name,
		Description: description,
		Coordinates: models.Polygon(coordinates),
		Category:    category,
		Status:      "active",
	}

	err = s.repo.Create(geofence)
	if err != nil {
		return nil, err
	}

	return geofence, nil
}

func (s *geofenceService) GetAllGeofences(category string) ([]models.Geofence, error) {
	return s.repo.GetAll(category)
}

func (s *geofenceService) GetGeofenceByID(id string) (*models.Geofence, error) {
	return s.repo.GetByID(id)
}

func (s *geofenceService) UpdateGeofence(id, name, description, category string, coordinates [][]float64) (*models.Geofence, error) {
	geofence, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if name != "" {
		geofence.Name = name
	}
	if description != "" {
		geofence.Description = description
	}
	if category != "" {
		geofence.Category = category
	}
	if len(coordinates) > 0 {
		err := utils.ValidatePolygon(coordinates)
		if err != nil {
			return nil, err
		}
		geofence.Coordinates = models.Polygon(coordinates)
	}

	err = s.repo.Update(geofence)
	if err != nil {
		return nil, err
	}

	return geofence, nil
}

func (s *geofenceService) DeleteGeofence(id string) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(id)
}
