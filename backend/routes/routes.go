package routes

import (
	"backend/controllers"
	"backend/middleware"
	"backend/websocket"
	"github.com/gin-gonic/gin"
)

func SetupRouter(
	geofenceCtrl *controllers.GeofenceController,
	vehicleCtrl *controllers.VehicleController,
	locationCtrl *controllers.LocationController,
	alertCtrl *controllers.AlertController,
	violationCtrl *controllers.ViolationController,
	wsHub *websocket.Hub,
) *gin.Engine {
	r := gin.New()

	// Logger & Recovery
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS Setup
	r.Use(middleware.CORSMiddleware())

	// Timing middleware (injects time_ns)
	r.Use(middleware.ResponseTimeMiddleware())

	// WebSocket handler
	r.GET("/ws/alerts", func(c *gin.Context) {
		websocket.ServeWs(wsHub, c.Writer, c.Request)
	})

	// Grouping under /api
	apiGroup := r.Group("/api")
	{
		// Geofences
		apiGroup.POST("/geofences", geofenceCtrl.Create)
		apiGroup.GET("/geofences", geofenceCtrl.GetAll)
		apiGroup.GET("/geofences/:id", geofenceCtrl.GetByID)
		apiGroup.PUT("/geofences/:id", geofenceCtrl.Update)
		apiGroup.DELETE("/geofences/:id", geofenceCtrl.Delete)

		// Vehicles
		apiGroup.POST("/vehicles", vehicleCtrl.Register)
		apiGroup.GET("/vehicles", vehicleCtrl.GetAll)
		apiGroup.GET("/vehicles/:id", vehicleCtrl.GetByID)
		apiGroup.PUT("/vehicles/:id", vehicleCtrl.Update)
		apiGroup.DELETE("/vehicles/:id", vehicleCtrl.Delete)

		// Location Updates
		apiGroup.POST("/locations", locationCtrl.Update)
		apiGroup.POST("/vehicles/location", locationCtrl.Update)
		apiGroup.GET("/vehicles/location/:vehicle_id", locationCtrl.GetByVehicleID)
		apiGroup.GET("/vehicles/locations", locationCtrl.GetCurrentLocations)

		// Alerts Configuration
		apiGroup.POST("/alerts/configure", alertCtrl.Configure)
		apiGroup.GET("/alerts", alertCtrl.GetAll)
		apiGroup.DELETE("/alerts/:id", alertCtrl.Delete)

		// Violations/Alerts history
		apiGroup.GET("/violations", violationCtrl.GetHistory)
		apiGroup.GET("/violations/history", violationCtrl.GetHistory)
	}

	// Root path mappings (without /api) for strict compatibility
	{
		// Geofences
		r.POST("/geofences", geofenceCtrl.Create)
		r.GET("/geofences", geofenceCtrl.GetAll)
		r.GET("/geofences/:id", geofenceCtrl.GetByID)
		r.PUT("/geofences/:id", geofenceCtrl.Update)
		r.DELETE("/geofences/:id", geofenceCtrl.Delete)

		// Vehicles
		r.POST("/vehicles", vehicleCtrl.Register)
		r.GET("/vehicles", vehicleCtrl.GetAll)
		r.GET("/vehicles/:id", vehicleCtrl.GetByID)
		r.PUT("/vehicles/:id", vehicleCtrl.Update)
		r.DELETE("/vehicles/:id", vehicleCtrl.Delete)

		// Location Updates
		r.POST("/vehicles/location", locationCtrl.Update)
		r.POST("/locations", locationCtrl.Update)
		r.GET("/vehicles/location/:vehicle_id", locationCtrl.GetByVehicleID)
		r.GET("/vehicles/locations", locationCtrl.GetCurrentLocations)
		r.GET("/locations", locationCtrl.GetCurrentLocations)

		// Alerts Configuration
		r.POST("/alerts/configure", alertCtrl.Configure)
		r.GET("/alerts", alertCtrl.GetAll)
		r.DELETE("/alerts/:id", alertCtrl.Delete)

		// Violations/Alerts history
		r.GET("/violations/history", violationCtrl.GetHistory)
		r.GET("/violations", violationCtrl.GetHistory)
	}

	// Base index endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "Geofencing Real-Time Alert System API",
		})
	})

	return r
}
