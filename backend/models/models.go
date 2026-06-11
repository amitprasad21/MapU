package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// Polygon represents coordinates as [[lat, lng], ...]
type Polygon [][]float64

// Value implements the driver.Valuer interface
func (p Polygon) Value() (driver.Value, error) {
	if len(p) == 0 {
		return "[]", nil
	}
	bytes, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

// Scan implements the sql.Scanner interface
func (p *Polygon) Scan(value interface{}) error {
	if value == nil {
		*p = Polygon{}
		return nil
	}
	
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("invalid type for Polygon scan")
	}

	return json.Unmarshal(bytes, p)
}

// Geofence model
type Geofence struct {
	ID          string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Coordinates Polygon   `gorm:"type:jsonb" json:"coordinates"`
	Category    string    `gorm:"type:varchar(50);not null" json:"category"`
	Status      string    `gorm:"type:varchar(20);default:'active'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Vehicle model
type Vehicle struct {
	ID            string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	VehicleNumber string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"vehicle_number"`
	DriverName    string    `gorm:"type:varchar(100);not null" json:"driver_name"`
	VehicleType   string    `gorm:"type:varchar(50);not null" json:"vehicle_type"`
	Phone         string    `gorm:"type:varchar(20);not null" json:"phone"`
	Status        string    `gorm:"type:varchar(20);default:'active'" json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// VehicleLocation model
type VehicleLocation struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	VehicleID string    `gorm:"type:varchar(50);index;not null" json:"vehicle_id"`
	Vehicle   Vehicle   `gorm:"foreignKey:VehicleID;constraint:OnDelete:CASCADE" json:"-"`
	Latitude  float64   `gorm:"not null" json:"latitude"`
	Longitude float64   `gorm:"not null" json:"longitude"`
	RecordedAt time.Time `gorm:"not null" json:"recorded_at"`
}

// AlertRule model (configured alert settings)
type AlertRule struct {
	ID         string    `gorm:"primaryKey;type:varchar(50)" json:"alert_id"`
	GeofenceID string    `gorm:"type:varchar(50);index;not null" json:"geofence_id"`
	Geofence   Geofence  `gorm:"foreignKey:GeofenceID;constraint:OnDelete:CASCADE" json:"-"`
	VehicleID  *string   `gorm:"type:varchar(50);index" json:"vehicle_id"`
	Vehicle    *Vehicle  `gorm:"foreignKey:VehicleID;constraint:OnDelete:SET NULL" json:"-"`
	EventType  string    `gorm:"type:varchar(20);not null" json:"event_type"` // entry, exit, both
	Status     string    `gorm:"type:varchar(20);default:'active'" json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Violation model (historical alert events log)
type Violation struct {
	ID         string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	VehicleID  string    `gorm:"type:varchar(50);index;not null" json:"vehicle_id"`
	Vehicle    Vehicle   `gorm:"foreignKey:VehicleID;constraint:OnDelete:CASCADE" json:"-"`
	GeofenceID string    `gorm:"type:varchar(50);index;not null" json:"geofence_id"`
	Geofence   Geofence  `gorm:"foreignKey:GeofenceID;constraint:OnDelete:CASCADE" json:"-"`
	EventType  string    `gorm:"type:varchar(20);not null" json:"event_type"` // entry, exit
	Latitude   float64   `gorm:"not null" json:"latitude"`
	Longitude  float64   `gorm:"not null" json:"longitude"`
	Timestamp  time.Time `gorm:"not null" json:"timestamp"`
}
