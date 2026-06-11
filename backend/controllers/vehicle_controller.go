package controllers

import (
	"net/http"

	"backend/services"
	"github.com/gin-gonic/gin"
)

type VehicleController struct {
	service services.VehicleService
}

func NewVehicleController(service services.VehicleService) *VehicleController {
	return &VehicleController{service: service}
}

type RegisterVehicleInput struct {
	VehicleNumber string `json:"vehicle_number" binding:"required"`
	DriverName    string `json:"driver_name" binding:"required"`
	VehicleType   string `json:"vehicle_type" binding:"required"`
	Phone         string `json:"phone" binding:"required"`
}

type UpdateVehicleInput struct {
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
	VehicleType   string `json:"vehicle_type"`
	Phone         string `json:"phone"`
	Status        string `json:"status"`
}

func (ctrl *VehicleController) Register(c *gin.Context) {
	var input RegisterVehicleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vehicle, err := ctrl.service.RegisterVehicle(input.VehicleNumber, input.DriverName, input.VehicleType, input.Phone)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":             vehicle.ID,
		"vehicle_number": vehicle.VehicleNumber,
		"status":         vehicle.Status,
	})
}

func (ctrl *VehicleController) GetAll(c *gin.Context) {
	vehicles, err := ctrl.service.GetAllVehicles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"vehicles": vehicles,
	})
}

func (ctrl *VehicleController) GetByID(c *gin.Context) {
	id := c.Param("id")
	vehicle, err := ctrl.service.GetVehicleByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

func (ctrl *VehicleController) Update(c *gin.Context) {
	id := c.Param("id")
	var input UpdateVehicleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vehicle, err := ctrl.service.UpdateVehicle(id, input.VehicleNumber, input.DriverName, input.VehicleType, input.Phone, input.Status)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

func (ctrl *VehicleController) Delete(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.service.DeleteVehicle(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "vehicle deleted successfully"})
}
