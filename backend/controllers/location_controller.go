package controllers

import (
	"fmt"
	"net/http"
	"time"

	"backend/services"
	"github.com/gin-gonic/gin"
)

type LocationController struct {
	service services.LocationService
}

func NewLocationController(service services.LocationService) *LocationController {
	return &LocationController{service: service}
}

type LocationUpdateInput struct {
	VehicleID interface{} `json:"vehicle_id" binding:"required"`
	Latitude  float64     `json:"latitude" binding:"required"`
	Longitude float64     `json:"longitude" binding:"required"`
	Timestamp *string     `json:"timestamp"`
}

func (ctrl *LocationController) Update(c *gin.Context) {
	var input LocationUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Safely extract vehicle ID as string
	var vehicleIDStr string
	switch v := input.VehicleID.(type) {
	case string:
		vehicleIDStr = v
	case float64:
		vehicleIDStr = fmt.Sprintf("%.0f", v)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "vehicle_id must be a string or integer"})
		return
	}

	// Parse timestamp or default to now
	t := time.Now()
	if input.Timestamp != nil && *input.Timestamp != "" {
		if parsedTime, err := time.Parse(time.RFC3339, *input.Timestamp); err == nil {
			t = parsedTime
		} else if parsedTime, err := time.Parse("2006-01-02T15:04:05.000Z", *input.Timestamp); err == nil {
			t = parsedTime
		} else if parsedTime, err := time.Parse("2006-01-02 15:04:05", *input.Timestamp); err == nil {
			t = parsedTime
		}
	}

	result, err := ctrl.service.UpdateLocation(vehicleIDStr, input.Latitude, input.Longitude, t)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (ctrl *LocationController) GetByVehicleID(c *gin.Context) {
	vehicleID := c.Param("vehicle_id")
	result, err := ctrl.service.GetVehicleLocation(vehicleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (ctrl *LocationController) GetCurrentLocations(c *gin.Context) {
	locations, err := ctrl.service.GetCurrentLocations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"locations": locations,
	})
}
