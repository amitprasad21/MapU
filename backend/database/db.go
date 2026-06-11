package database

import (
	"log"
	"time"

	"backend/configs"
	"backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes PostgreSQL connection using GORM
func InitDB(config *configs.Config) *gorm.DB {
	var err error
	var db *gorm.DB

	// Set up logger
	newLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Retry connection a few times
	for i := 0; i < 5; i++ {
		db, err = gorm.Open(postgres.Open(config.DatabaseURL), &gorm.Config{
			Logger: newLogger,
		})
		if err == nil {
			break
		}
		log.Printf("Failed to connect to database (attempt %d/5): %v", i+1, err)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Fatal: Database connection failed: %v", err)
	}

	log.Println("Database connection established successfully.")

	// Run migrations
	err = db.AutoMigrate(
		&models.Geofence{},
		&models.Vehicle{},
		&models.VehicleLocation{},
		&models.AlertRule{},
		&models.Violation{},
	)
	if err != nil {
		log.Fatalf("Fatal: Database migration failed: %v", err)
	}

	log.Println("Database migration completed.")

	DB = db
	return db
}
