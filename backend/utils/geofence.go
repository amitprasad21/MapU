package utils

import (
	"errors"
)

// IsPointInsidePolygon checks if a point (lat, lng) is inside a polygon using Ray Casting
func IsPointInsidePolygon(lat, lng float64, polygon [][]float64) bool {
	n := len(polygon)
	if n < 4 {
		return false
	}

	inside := false
	x := lng
	y := lat

	// Ray casting algorithm
	for i, j := 0, n-1; i < n; i++ {
		xi, yi := polygon[i][1], polygon[i][0] // lng, lat
		xj, yj := polygon[j][1], polygon[j][0] // lng, lat

		intersect := ((yi > y) != (yj > y)) &&
			(x < (xj-xi)*(y-yi)/(yj-yi)+xi)
		if intersect {
			inside = !inside
		}
		j = i
	}

	return inside
}

// CheckVehicleEntry returns true if the vehicle was outside but is now inside
func CheckVehicleEntry(prevLat, prevLng, currLat, currLng float64, polygon [][]float64) bool {
	wasInside := IsPointInsidePolygon(prevLat, prevLng, polygon)
	isInside := IsPointInsidePolygon(currLat, currLng, polygon)
	return !wasInside && isInside
}

// CheckVehicleExit returns true if the vehicle was inside but is now outside
func CheckVehicleExit(prevLat, prevLng, currLat, currLng float64, polygon [][]float64) bool {
	wasInside := IsPointInsidePolygon(prevLat, prevLng, polygon)
	isInside := IsPointInsidePolygon(currLat, currLng, polygon)
	return wasInside && !isInside
}

// ValidatePolygon checks if a coordinates array forms a valid closed polygon
func ValidatePolygon(polygon [][]float64) error {
	n := len(polygon)
	if n < 4 {
		return errors.New("polygon must have at least 4 coordinates (3 unique points + 1 closing point)")
	}

	// Validate latitude / longitude bounds and format
	for _, pt := range polygon {
		if len(pt) != 2 {
			return errors.New("each coordinate pair must contain exactly 2 numbers [latitude, longitude]")
		}
		lat, lng := pt[0], pt[1]
		if lat < -90 || lat > 90 {
			return errors.New("latitude must be between -90 and 90")
		}
		if lng < -180 || lng > 180 {
			return errors.New("longitude must be between -180 and 180")
		}
	}

	// Check if closed (first and last coordinate must be identical)
	first := polygon[0]
	last := polygon[n-1]
	if first[0] != last[0] || first[1] != last[1] {
		return errors.New("polygon is not closed (first and last coordinates must be identical)")
	}

	return nil
}
