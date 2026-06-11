package services

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"backend/models"
	"backend/repositories"
	"backend/utils"
	"backend/websocket"
)

type LocationService interface {
	UpdateLocation(vehicleID string, lat, lng float64, timestamp time.Time) (*LocationUpdateResult, error)
	GetVehicleLocation(vehicleID string) (*VehicleLocationResult, error)
	GetCurrentLocations() ([]models.VehicleLocation, error)
}

type LocationUpdateResult struct {
	VehicleID        string           `json:"vehicle_id"`
	LocationUpdated  bool             `json:"location_updated"`
	CurrentGeofences []GeofenceStatus `json:"current_geofences"`
}

type GeofenceStatus struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Status       string `json:"status"` // "inside"
}

type VehicleLocationResult struct {
	VehicleID        string                    `json:"vehicle_id"`
	VehicleNumber    string                    `json:"vehicle_number"`
	CurrentLocation  *CurrentLocationPayload   `json:"current_location"`
	CurrentGeofences []CurrentGeofencePayload  `json:"current_geofences"`
}

type CurrentLocationPayload struct {
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}

type CurrentGeofencePayload struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}

type locationService struct {
	repo          repositories.LocationRepository
	vehicleRepo   repositories.VehicleRepository
	geofenceRepo  repositories.GeofenceRepository
	alertRepo     repositories.AlertRepository
	violationRepo repositories.ViolationRepository
	wsHub         *websocket.Hub
}

func NewLocationService(
	repo repositories.LocationRepository,
	vehicleRepo repositories.VehicleRepository,
	geofenceRepo repositories.GeofenceRepository,
	alertRepo repositories.AlertRepository,
	violationRepo repositories.ViolationRepository,
	wsHub *websocket.Hub,
) LocationService {
	return &locationService{
		repo:          repo,
		vehicleRepo:   vehicleRepo,
		geofenceRepo:  geofenceRepo,
		alertRepo:     alertRepo,
		violationRepo: violationRepo,
		wsHub:         wsHub,
	}
}

func (s *locationService) UpdateLocation(vehicleID string, lat, lng float64, timestamp time.Time) (*LocationUpdateResult, error) {
	// 1. Verify vehicle exists
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		return nil, errors.New("vehicle not found")
	}

	// Validate coordinates bounds
	if lat < -90 || lat > 90 {
		return nil, errors.New("latitude must be between -90 and 90")
	}
	if lng < -180 || lng > 180 {
		return nil, errors.New("longitude must be between -180 and 180")
	}

	// 2. Save location update
	loc := &models.VehicleLocation{
		VehicleID:  vehicleID,
		Latitude:   lat,
		Longitude:  lng,
		RecordedAt: timestamp,
	}
	err = s.repo.Create(loc)
	if err != nil {
		return nil, err
	}

	// 3. Get previous location (latest before this new one)
	prevLoc, _ := s.repo.GetLatestForVehicleBefore(vehicleID, loc.ID)

	// 4. Get all active geofences
	geofences, err := s.geofenceRepo.GetAll("")
	if err != nil {
		return nil, err
	}

	var currentGeofences []GeofenceStatus

	// 5. Evaluate geofence entry/exit transitions
	for _, geofence := range geofences {
		currInside := utils.IsPointInsidePolygon(lat, lng, geofence.Coordinates)

		if currInside {
			currentGeofences = append(currentGeofences, GeofenceStatus{
				GeofenceID:   geofence.ID,
				GeofenceName: geofence.Name,
				Status:       "inside",
			})
		}

		var transitionDetected bool
		var eventType string

		if prevLoc != nil {
			prevInside := utils.IsPointInsidePolygon(prevLoc.Latitude, prevLoc.Longitude, geofence.Coordinates)
			if !prevInside && currInside {
				transitionDetected = true
				eventType = "entry"
			} else if prevInside && !currInside {
				transitionDetected = true
				eventType = "exit"
			}
		} else {
			// First location recorded for this vehicle, count as entry if inside
			if currInside {
				transitionDetected = true
				eventType = "entry"
			}
		}

		if transitionDetected {
			// Check matching alert rules
			rules, err := s.alertRepo.GetMatchingRules(geofence.ID, vehicleID, eventType)
			if err == nil && len(rules) > 0 {
				// Create violation log asynchronously
				go func(g models.Geofence, evType string) {
					viol := &models.Violation{
						ID:         utils.GenerateID("viol_"),
						VehicleID:  vehicleID,
						GeofenceID: g.ID,
						EventType:  evType,
						Latitude:   lat,
						Longitude:  lng,
						Timestamp:  timestamp,
					}
					
					if err := s.violationRepo.Create(viol); err != nil {
						log.Printf("Failed to record violation: %v", err)
					}

					// Broadcast real-time alert via WebSocket
					payload := websocket.AlertPayload{
						EventID:   viol.ID,
						EventType: evType,
						Timestamp: timestamp.Format(time.RFC3339),
						Vehicle: websocket.VehiclePayload{
							VehicleID:     vehicle.ID,
							VehicleNumber: vehicle.VehicleNumber,
							DriverName:    vehicle.DriverName,
						},
						Geofence: websocket.GeofencePayload{
							GeofenceID:   g.ID,
							GeofenceName: g.Name,
							Category:     g.Category,
						},
						Location: websocket.LocationPayload{
							Latitude:  lat,
							Longitude: lng,
						},
					}

					if bytes, err := json.Marshal(payload); err == nil {
						s.wsHub.BroadcastAlert(bytes)
						log.Printf("Broadcasted %s alert for vehicle %s in geofence %s", evType, vehicle.VehicleNumber, g.Name)
					} else {
						log.Printf("Failed to marshal WS alert: %v", err)
					}
				}(geofence, eventType)
			}
		}
	}

	return &LocationUpdateResult{
		VehicleID:        vehicleID,
		LocationUpdated:  true,
		CurrentGeofences: currentGeofences,
	}, nil
}

func (s *locationService) GetVehicleLocation(vehicleID string) (*VehicleLocationResult, error) {
	// Verify vehicle exists
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		return nil, errors.New("vehicle not found")
	}

	// Fetch latest location
	latestLoc, err := s.repo.GetLatestForVehicle(vehicleID)
	if err != nil {
		// If no location exists, return vehicle details with empty location
		return &VehicleLocationResult{
			VehicleID:        vehicleID,
			VehicleNumber:    vehicle.VehicleNumber,
			CurrentLocation:  nil,
			CurrentGeofences: []CurrentGeofencePayload{},
		}, nil
	}

	// Find containing geofences
	geofences, err := s.geofenceRepo.GetAll("")
	if err != nil {
		return nil, err
	}

	var currentGeofences []CurrentGeofencePayload
	for _, geofence := range geofences {
		if utils.IsPointInsidePolygon(latestLoc.Latitude, latestLoc.Longitude, geofence.Coordinates) {
			currentGeofences = append(currentGeofences, CurrentGeofencePayload{
				GeofenceID:   geofence.ID,
				GeofenceName: geofence.Name,
				Category:     geofence.Category,
			})
		}
	}

	return &VehicleLocationResult{
		VehicleID:     vehicleID,
		VehicleNumber: vehicle.VehicleNumber,
		CurrentLocation: &CurrentLocationPayload{
			Latitude:  latestLoc.Latitude,
			Longitude: latestLoc.Longitude,
			Timestamp: latestLoc.RecordedAt,
		},
		CurrentGeofences: currentGeofences,
	}, nil
}

func (s *locationService) GetCurrentLocations() ([]models.VehicleLocation, error) {
	return s.repo.GetCurrentLocations()
}
