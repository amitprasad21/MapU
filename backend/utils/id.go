package utils

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateID creates a unique ID with the given prefix (e.g., geo_f83a2c4e)
func GenerateID(prefix string) string {
	bytes := make([]byte, 8)
	_, _ = rand.Read(bytes)
	return prefix + hex.EncodeToString(bytes)
}
