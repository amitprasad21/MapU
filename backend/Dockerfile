# Step 1: Build the Go application
FROM golang:1.20-alpine AS builder

WORKDIR /app

# Copy application source code
COPY . .

# Run go mod tidy to automatically scan source files and generate go.sum
RUN go mod tidy

# Build the application binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main .

# Step 2: Create a minimal production runner image
FROM alpine:3.18

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Command to run
CMD ["./main"]
