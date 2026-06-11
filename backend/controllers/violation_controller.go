package controllers

import (
	"net/http"
	"strconv"
	"time"

	"backend/services"
	"github.com/gin-gonic/gin"
)

type ViolationController struct {
	service services.ViolationService
}

func NewViolationController(service services.ViolationService) *ViolationController {
	return &ViolationController{service: service}
}

type ViolationResponse struct {
	ID            string  `json:"id"`
	VehicleID     string  `json:"vehicle_id"`
	VehicleNumber string  `json:"vehicle_number"`
	GeofenceID    string  `json:"geofence_id"`
	GeofenceName  string  `json:"geofence_name"`
	EventType     string  `json:"event_type"` // entry, exit
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Timestamp     string  `json:"timestamp"`
}

func (ctrl *ViolationController) GetHistory(c *gin.Context) {
	vehicleID := c.Query("vehicle_id")
	geofenceID := c.Query("geofence_id")

	var startDate *time.Time
	if sd := c.Query("start_date"); sd != "" {
		if t, err := time.Parse(time.RFC3339, sd); err == nil {
			startDate = &t
		} else if t, err := time.Parse("2006-01-02", sd); err == nil {
			startDate = &t
		}
	}

	var endDate *time.Time
	if ed := c.Query("end_date"); ed != "" {
		if t, err := time.Parse(time.RFC3339, ed); err == nil {
			endDate = &t
		} else if t, err := time.Parse("2006-01-02", ed); err == nil {
			endDate = &t
		}
	}

	limit := 50
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil {
			limit = l
		}
	}
	if limit > 500 {
		limit = 500
	}
	if limit <= 0 {
		limit = 50
	}

	page := 1
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil {
			page = p
		}
	}
	if page <= 0 {
		page = 1
	}

	offset := (page - 1) * limit

	violations, totalCount, err := ctrl.service.GetViolationHistory(vehicleID, geofenceID, startDate, endDate, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Format response to match required schema
	response := make([]ViolationResponse, len(violations))
	for i, v := range violations {
		response[i] = ViolationResponse{
			ID:            v.ID,
			VehicleID:     v.VehicleID,
			VehicleNumber: v.Vehicle.VehicleNumber,
			GeofenceID:    v.GeofenceID,
			GeofenceName:  v.Geofence.Name,
			EventType:     v.EventType,
			Latitude:      v.Latitude,
			Longitude:     v.Longitude,
			Timestamp:     v.Timestamp.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"violations":  response,
		"total_count": totalCount,
	})
}
