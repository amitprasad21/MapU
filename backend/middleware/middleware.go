package middleware

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseBodyWriter) Write(b []byte) (int, error) {
	return w.body.Write(b)
}

func (w *responseBodyWriter) WriteString(s string) (int, error) {
	return w.body.WriteString(s)
}

// ResponseTimeMiddleware measures API response time and appends time_ns to JSON responses
func ResponseTimeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Do not process timing middleware for WebSockets
		if c.Request.Header.Get("Upgrade") == "websocket" {
			c.Next()
			return
		}

		start := time.Now()

		// Wrap response writer
		w := &responseBodyWriter{body: &bytes.Buffer{}, ResponseWriter: c.Writer}
		c.Writer = w

		c.Next()

		elapsed := time.Since(start).Nanoseconds()
		elapsedStr := strconv.FormatInt(elapsed, 10)

		contentType := w.Header().Get("Content-Type")
		if strings.Contains(contentType, "application/json") && w.body.Len() > 0 {
			var data map[string]interface{}
			if err := json.Unmarshal(w.body.Bytes(), &data); err == nil {
				data["time_ns"] = elapsedStr
				newBody, err := json.Marshal(data)
				if err == nil {
					// Set Content-Length header to correct size
					w.ResponseWriter.Header().Set("Content-Length", strconv.Itoa(len(newBody)))
					w.ResponseWriter.Write(newBody)
					return
				}
			}
		}

		// Fallback: write original buffered body
		w.ResponseWriter.Write(w.body.Bytes())
	}
}

// CORSMiddleware configuration
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
