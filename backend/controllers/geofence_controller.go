package controllers

import (
	"net/http"

	"backend/services"
	"github.com/gin-gonic/gin"
)

type GeofenceController struct {
	service services.GeofenceService
}

func NewGeofenceController(service services.GeofenceService) *GeofenceController {
	return &GeofenceController{service: service}
}

type CreateGeofenceInput struct {
	Name        string      `json:"name" binding:"required"`
	Description string      `json:"description"`
	Coordinates [][]float64 `json:"coordinates" binding:"required"`
	Category    string      `json:"category" binding:"required"`
}

type UpdateGeofenceInput struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Coordinates [][]float64 `json:"coordinates"`
	Category    string      `json:"category"`
}

func (ctrl *GeofenceController) Create(c *gin.Context) {
	var input CreateGeofenceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	geofence, err := ctrl.service.CreateGeofence(input.Name, input.Description, input.Category, input.Coordinates)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":     geofence.ID,
		"name":   geofence.Name,
		"status": geofence.Status,
	})
}

func (ctrl *GeofenceController) GetAll(c *gin.Context) {
	category := c.Query("category")
	geofences, err := ctrl.service.GetAllGeofences(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"geofences": geofences,
	})
}

func (ctrl *GeofenceController) GetByID(c *gin.Context) {
	id := c.Param("id")
	geofence, err := ctrl.service.GetGeofenceByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "geofence not found"})
		return
	}

	c.JSON(http.StatusOK, geofence)
}

func (ctrl *GeofenceController) Update(c *gin.Context) {
	id := c.Param("id")
	var input UpdateGeofenceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	geofence, err := ctrl.service.UpdateGeofence(id, input.Name, input.Description, input.Category, input.Coordinates)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, geofence)
}

func (ctrl *GeofenceController) Delete(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.service.DeleteGeofence(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "geofence not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "geofence deleted successfully"})
}
