package utils

import (
	"testing"
)

func TestIsPointInsidePolygon(t *testing.T) {
	// A simple square polygon: [lat, lng]
	// Boundaries: Lat 10 to 20, Lng 10 to 20
	polygon := [][]float64{
		{10, 10},
		{20, 10},
		{20, 20},
		{10, 20},
		{10, 10}, // closed
	}

	tests := []struct {
		name     string
		lat      float64
		lng      float64
		expected bool
	}{
		{"Point inside", 15, 15, true},
		{"Point outside left", 15, 5, false},
		{"Point outside right", 15, 25, false},
		{"Point outside top", 25, 15, false},
		{"Point outside bottom", 5, 15, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsPointInsidePolygon(tt.lat, tt.lng, polygon)
			if result != tt.expected {
				t.Errorf("IsPointInsidePolygon(%f, %f) = %v; expected %v", tt.lat, tt.lng, result, tt.expected)
			}
		})
	}
}

func TestCheckVehicleEntry(t *testing.T) {
	polygon := [][]float64{
		{0, 0},
		{10, 0},
		{10, 10},
		{0, 10},
		{0, 0},
	}

	// Case 1: Outside to Inside (Entry)
	if !CheckVehicleEntry(5, -5, 5, 5, polygon) {
		t.Error("Expected CheckVehicleEntry to be true when moving from outside to inside")
	}

	// Case 2: Outside to Outside (No Entry)
	if CheckVehicleEntry(5, -5, 5, -2, polygon) {
		t.Error("Expected CheckVehicleEntry to be false when moving outside to outside")
	}

	// Case 3: Inside to Inside (No Entry)
	if CheckVehicleEntry(5, 5, 5, 6, polygon) {
		t.Error("Expected CheckVehicleEntry to be false when moving inside to inside")
	}

	// Case 4: Inside to Outside (Exit, No Entry)
	if CheckVehicleEntry(5, 5, 5, 15, polygon) {
		t.Error("Expected CheckVehicleEntry to be false when moving inside to outside")
	}
}

func TestCheckVehicleExit(t *testing.T) {
	polygon := [][]float64{
		{0, 0},
		{10, 0},
		{10, 10},
		{0, 10},
		{0, 0},
	}

	// Case 1: Inside to Outside (Exit)
	if !CheckVehicleExit(5, 5, 5, 15, polygon) {
		t.Error("Expected CheckVehicleExit to be true when moving from inside to outside")
	}

	// Case 2: Outside to Outside (No Exit)
	if CheckVehicleExit(5, -5, 5, -2, polygon) {
		t.Error("Expected CheckVehicleExit to be false when moving outside to outside")
	}

	// Case 3: Inside to Inside (No Exit)
	if CheckVehicleExit(5, 5, 5, 6, polygon) {
		t.Error("Expected CheckVehicleExit to be false when moving inside to inside")
	}

	// Case 4: Outside to Inside (Entry, No Exit)
	if CheckVehicleExit(5, -5, 5, 5, polygon) {
		t.Error("Expected CheckVehicleExit to be false when moving outside to inside")
	}
}

func TestValidatePolygon(t *testing.T) {
	tests := []struct {
		name        string
		coordinates [][]float64
		expectError bool
	}{
		{
			"Valid closed polygon",
			[][]float64{{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}},
			false,
		},
		{
			"Too few coordinates",
			[][]float64{{0, 0}, {0, 10}, {0, 0}},
			true,
		},
		{
			"Not closed",
			[][]float64{{0, 0}, {0, 10}, {10, 10}, {10, 0}, {1, 1}},
			true,
		},
		{
			"Invalid latitude",
			[][]float64{{-95, 0}, {0, 10}, {10, 10}, {10, 0}, {-95, 0}},
			true,
		},
		{
			"Invalid longitude",
			[][]float64{{0, 185}, {0, 10}, {10, 10}, {10, 0}, {0, 185}},
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePolygon(tt.coordinates)
			if (err != nil) != tt.expectError {
				t.Errorf("ValidatePolygon() error = %v, expectError = %v", err, tt.expectError)
			}
		})
	}
}
