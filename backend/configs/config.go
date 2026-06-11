package configs

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback to supabase detail provided in user request
		dbURL = "postgresql://postgres:MapU7029139659@db.dcpvbkamaookbastcsgv.supabase.co:5432/postgres"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
	}
}
