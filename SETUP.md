# SETUP & API TESTING GUIDE

This document provides step-by-step instructions for running the Geofencing Real-Time Alert System locally, using Docker Compose, and testing the REST API.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:

1. **Docker & Docker Compose** (Highly Recommended)
2. Or for local development without Docker:
   - **Go** (v1.20+)
   - **Node.js** (v18+)
   - **PostgreSQL** (running locally or a remote Supabase instance)

---

## 🚀 Running the System

### Method 1: Docker Compose (Recommended)

Docker Compose sets up a local PostgreSQL database, compiles the Go backend, builds the React frontend, and runs them together.

1. **Start all services**:
   ```bash
   docker-compose up --build
   ```
2. **Access the applications**:
   - **React Frontend (Dashboard)**: [http://localhost:3000](http://localhost:3000)
   - **Go Backend API**: [http://localhost:8080](http://localhost:8080)
   - **Local PostgreSQL**: `localhost:5432` (User: `postgres`, Password: `password123`, DB: `geofence_db`)

---

### Method 2: Manual Local Running

If you choose to run the applications directly on your machine:

#### 1. Setup the Database
Create a database in PostgreSQL or use the provided Supabase Postgres database.
Set the connection URL in the backend configuration.

#### 2. Run the Backend
1. Open a terminal in the `backend/` directory.
2. Configure environmental variables (or create a `.env` file):
   ```bash
   # Windows PowerShell
   $env:PORT="8080"
   $env:DATABASE_URL="postgresql://postgres:MapU7029139659@db.dcpvbkamaookbastcsgv.supabase.co:5432/postgres"
   
   # Linux/macOS Bash
   export PORT=8080
   export DATABASE_URL="postgresql://postgres:MapU7029139659@db.dcpvbkamaookbastcsgv.supabase.co:5432/postgres"
   ```
3. Run the Go server:
   ```bash
   go run main.go
   ```

#### 3. Run the Frontend
1. Open a terminal in the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the address shown (usually `http://localhost:5173`).

---

## 📡 API Testing Guide

The system seeds sample data automatically on startup if the database is empty:
- **Sample Geofence Zone**: `geo_123` (Downtown Delivery Zone in San Francisco)
- **Sample Vehicle**: `veh_456` (Vehicle Number: `KA-01-AB-1234`)
- **Sample Alert Rule**: `alert_789` (Monitors vehicle `veh_456` in geofence `geo_123` for `both` entry/exit transitions)

Here are the curl commands to test all REST APIs:

### 1. Geofences API

#### Create a Geofence
```bash
curl -X POST http://localhost:8080/api/geofences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Delivery Zone",
    "description": "Main delivery area for downtown customers",
    "coordinates": [
      [37.7749, -122.4194],
      [37.7849, -122.4194],
      [37.7849, -122.4094],
      [37.7749, -122.4094],
      [37.7749, -122.4194]
    ],
    "category": "delivery_zone"
  }'
```

#### Fetch All Geofences
```bash
curl http://localhost:8080/api/geofences
```

#### Delete a Geofence
```bash
curl -X DELETE http://localhost:8080/api/geofences/geo_123
```

---

### 2. Vehicles API

#### Register a Vehicle
```bash
curl -X POST http://localhost:8080/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "KA-01-AB-1234",
    "driver_name": "John Doe",
    "vehicle_type": "truck",
    "phone": "+1234567890"
  }'
```

#### Fetch All Vehicles
```bash
curl http://localhost:8080/api/vehicles
```

---

### 3. Location Updates & Perimeter Violations

#### Send Location (Simulating Outside)
```bash
curl -X POST http://localhost:8080/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "veh_456",
    "latitude": 37.7600,
    "longitude": -122.4300,
    "timestamp": "2026-06-11T12:00:00Z"
  }'
```

#### Send Location (Simulating Geofence Entry)
*This update will trigger an **entry transition alert**, record a violation, and broadcast it over WebSocket.*
```bash
curl -X POST http://localhost:8080/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "veh_456",
    "latitude": 37.7800,
    "longitude": -122.4150,
    "timestamp": "2026-06-11T12:05:00Z"
  }'
```

#### Send Location (Simulating Geofence Exit)
*This update will trigger an **exit transition alert**.*
```bash
curl -X POST http://localhost:8080/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "veh_456",
    "latitude": 37.7600,
    "longitude": -122.4300,
    "timestamp": "2026-06-11T12:10:00Z"
  }'
```

#### Get Current Location of a Specific Vehicle
```bash
curl http://localhost:8080/api/vehicles/location/veh_456
```

---

### 4. Alert Rules API

#### Configure a Alert Rule
```bash
curl -X POST http://localhost:8080/api/alerts/configure \
  -H "Content-Type: application/json" \
  -d '{
    "geofence_id": "geo_123",
    "vehicle_id": "veh_456",
    "event_type": "both"
  }'
```

#### Fetch All Configured Rules
```bash
curl http://localhost:8080/api/alerts
```

---

### 5. Violations History API

#### Fetch Violations List (with pagination and optional filters)
```bash
curl "http://localhost:8080/api/violations/history?limit=10&page=1"
```
