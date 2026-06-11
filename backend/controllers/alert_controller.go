package controllers

import (
	"net/http"

	"backend/services"
	"github.com/gin-gonic/gin"
)

type AlertController struct {
	service services.AlertService
}

func NewAlertController(service services.AlertService) *AlertController {
	return &AlertController{service: service}
}

type ConfigureAlertInput struct {
	GeofenceID string `json:"geofence_id" binding:"required"`
	VehicleID  string `json:"vehicle_id"` // optional
	EventType  string `json:"event_type" binding:"required"` // entry, exit, both
}

func (ctrl *AlertController) Configure(c *gin.Context) {
	var input ConfigureAlertInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rule, err := ctrl.service.ConfigureAlert(input.GeofenceID, input.VehicleID, input.EventType)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Make sure fields match requirements: alert_id, geofence_id, vehicle_id, event_type, status
	var vID string
	if rule.VehicleID != nil {
		vID = *rule.VehicleID
	}

	c.JSON(http.StatusCreated, gin.H{
		"alert_id":    rule.ID,
		"geofence_id": rule.GeofenceID,
		"vehicle_id":  vID,
		"event_type":  rule.EventType,
		"status":      rule.Status,
	})
}

func (ctrl *AlertController) GetAll(c *gin.Context) {
	geofenceID := c.Query("geofence_id")
	vehicleID := c.Query("vehicle_id")

	rules, err := ctrl.service.GetAllAlertRules(geofenceID, vehicleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Map rules to match exact response fields
	type RuleResponse struct {
		AlertID       string `json:"alert_id"`
		GeofenceID    string `json:"geofence_id"`
		GeofenceName  string `json:"geofence_name"`
		VehicleID     string `json:"vehicle_id,omitempty"`
		VehicleNumber string `json:"vehicle_number,omitempty"`
		EventType     string `json:"event_type"`
		Status        string `json:"status"`
		CreatedAt     string `json:"created_at"`
	}

	response := make([]RuleResponse, len(rules))
	for i, rule := range rules {
		vID := ""
		vNum := ""
		if rule.VehicleID != nil {
			vID = *rule.VehicleID
			if rule.Vehicle != nil {
				vNum = rule.Vehicle.VehicleNumber
			}
		}

		response[i] = RuleResponse{
			AlertID:       rule.ID,
			GeofenceID:    rule.GeofenceID,
			GeofenceName:  rule.Geofence.Name,
			VehicleID:     vID,
			VehicleNumber: vNum,
			EventType:     rule.EventType,
			Status:        rule.Status,
			CreatedAt:     rule.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": response,
	})
}

func (ctrl *AlertController) Delete(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.service.DeleteAlertRule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert rule not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert rule deleted successfully"})
}
