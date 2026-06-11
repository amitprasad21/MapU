package main

import (
	"log"

	"backend/configs"
	"backend/controllers"
	"backend/database"
	"backend/models"
	"backend/repositories"
	"backend/routes"
	"backend/services"
	"backend/websocket"

	"gorm.io/gorm"
)

func main() {
	log.Println("Starting Geofencing Alert System Backend...")

	// 1. Load configurations
	config := configs.LoadConfig()

	// 2. Initialize database
	db := database.InitDB(config)

	// 3. Seed sample data if empty
	seedData(db)

	// 4. Initialize WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// 5. Initialize Repositories
	geofenceRepo := repositories.NewGeofenceRepository(db)
	vehicleRepo := repositories.NewVehicleRepository(db)
	locationRepo := repositories.NewLocationRepository(db)
	alertRepo := repositories.NewAlertRepository(db)
	violationRepo := repositories.NewViolationRepository(db)

	// 6. Initialize Services
	geofenceService := services.NewGeofenceService(geofenceRepo)
	vehicleService := services.NewVehicleService(vehicleRepo)
	locationService := services.NewLocationService(
		locationRepo,
		vehicleRepo,
		geofenceRepo,
		alertRepo,
		violationRepo,
		wsHub,
	)
	alertService := services.NewAlertService(alertRepo, geofenceRepo, vehicleRepo)
	violationService := services.NewViolationService(violationRepo)

	// 7. Initialize Controllers
	geofenceCtrl := controllers.NewGeofenceController(geofenceService)
	vehicleCtrl := controllers.NewVehicleController(vehicleService)
	locationCtrl := controllers.NewLocationController(locationService)
	alertCtrl := controllers.NewAlertController(alertService)
	violationCtrl := controllers.NewViolationController(violationService)

	// 8. Set up Router
	router := routes.SetupRouter(
		geofenceCtrl,
		vehicleCtrl,
		locationCtrl,
		alertCtrl,
		violationCtrl,
		wsHub,
	)

	// 9. Run server
	log.Printf("Server listening on port %s", config.Port)
	if err := router.Run(":" + config.Port); err != nil {
		log.Fatalf("Fatal: Failed to start server: %v", err)
	}
}

func seedData(db *gorm.DB) {
	var count int64

	// Seed Geofence
	db.Model(&models.Geofence{}).Count(&count)
	if count == 0 {
		geo := models.Geofence{
			ID:          "geo_123",
			Name:        "Downtown Delivery Zone",
			Description: "Main delivery area for downtown customers",
			Coordinates: models.Polygon{
				{37.7749, -122.4194},
				{37.7849, -122.4194},
				{37.7849, -122.4094},
				{37.7749, -122.4094},
				{37.7749, -122.4194},
			},
			Category:    "delivery_zone",
			Status:      "active",
		}
		db.Create(&geo)
		log.Println("Seeded default geofence: geo_123")
	}

	// Seed Vehicle
	db.Model(&models.Vehicle{}).Count(&count)
	if count == 0 {
		veh := models.Vehicle{
			ID:            "veh_456",
			VehicleNumber: "KA-01-AB-1234",
			DriverName:    "John Doe",
			VehicleType:   "truck",
			Phone:         "+1234567890",
			Status:        "active",
		}
		db.Create(&veh)
		log.Println("Seeded default vehicle: veh_456")

		// Seed Alert Rule for the vehicle in the geofence
		var alertCount int64
		db.Model(&models.AlertRule{}).Count(&alertCount)
		if alertCount == 0 {
			rule := models.AlertRule{
				ID:         "alert_789",
				GeofenceID: "geo_123",
				VehicleID:  &veh.ID,
				EventType:  "both",
				Status:     "active",
			}
			db.Create(&rule)
			log.Println("Seeded default alert rule: alert_789")
		}
	}
}
