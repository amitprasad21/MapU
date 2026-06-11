# 🛰️ GeoAlert: Real-Time Geofencing & Fleet Tracking System

[![Go Version](https://img.shields.io/badge/Go-1.20%2B-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![React Version](https://img.shields.io/badge/React-18%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Docker Support](https://img.shields.io/badge/Docker-Supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-amitprasad21-blue?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/u/amitprasad21)

GeoAlert is a production-ready, high-performance geofencing and vehicle telemetry tracking platform. It features a concurrency-safe **Golang** REST & WebSocket backend, a **PostgreSQL** relational database, and an ultra-premium **Light Glassmorphic Bento-Grid** frontend built with **React**, **Vite**, and **Leaflet Maps**.

---

## ✨ Key Features

*   **💎 Premium Light Glassmorphism UI**: A sleek, high-contrast Bento-grid design using a 40% translucent white canvas (`bg-white/40`), `backdrop-blur-xl`, bright crystal-white borders, volumetric drop shadows, and modern geometric **Outfit** typography.
*   **💡 Dynamic Ambient Glows**: Absolute-positioned backlight blobs (emerald, teal, indigo) behind the glass panel layers, creating volume and depth.
*   **🗺️ Interactive drawing & perimeter mapping**: Draw custom polygon geofences (Restricted, Delivery, Toll, Customer zones) directly on a responsive Leaflet map utilizing CartoDB Positron light-gray tiles.
*   **🎯 Ray-Casting Point-in-Polygon Engine**: Algorithmic coordinates evaluation on the Golang backend to determine vehicle intersection status.
*   **⚡ Real-Time WebSocket Alerts**: Gorilla-based bi-directional pipeline broadcasting instant `ENTRY` and `EXIT` toast notifications across all active operators' dashboards.
*   **🚚 Fleet Movement Simulator**: Click anywhere on the map to set a simulated position coordinates payload for any active vehicle and instantly trigger perimeter alarms.
*   **📊 Auditable Violation Logs**: Filterable, paginated audit records tracking crossing violations, with one-click **CSV export** capabilities.
*   **🔗 Interactive Navigation Map Links**: Clicking metrics cards, warning ticker alerts, or category lists instantly redirect focus to live tracking maps and coordinates.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend [React Frontend - Port 3000]
        UI[Leaflet Dashboard & Glass Panels]
        WS_Client[useWebSocket Hook]
        Axios[Axios API Client]
    end

    subgraph Backend [Go Backend API - Port 8080]
        Gin[Gin REST Router]
        WS_Server[Gorilla WebSocket Hub]
        G_Logic[Point-in-Polygon Engine]
        GORM[GORM Database Client]
    end

    subgraph Database [PostgreSQL Database]
        Tables[(Geofences, Vehicles, Locations, Alerts, Violations)]
    end

    UI -->|API Requests| Axios
    Axios -->|JSON REST API| Gin
    WS_Client <-->|Bi-directional WebSockets| WS_Server
    Gin --> G_Logic
    G_Logic -->|Check Transitions| GORM
    GORM <-->|Read / Write SQL| Tables
    WS_Server -.->|Broadcast Alerts| WS_Client
```

---

## 🚀 Running the Project

### Method 1: Run via Docker Hub Images (Simplest Setup)
You can run the entire pre-built environment using the public Docker Hub images without compiling any source code:

1. Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: geofence-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: geofence_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d geofence_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    image: amitprasad21/geofence-backend:latest
    container_name: geofence-backend
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATABASE_URL=postgresql://postgres:password123@postgres:5432/geofence_db?sslmode=disable
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: amitprasad21/geofence-frontend:latest
    container_name: geofence-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8080
      - VITE_WS_URL=ws://localhost:8080/ws/alerts
    depends_on:
      - backend
```

2. Start the stack:
```bash
docker compose up -d
```

---

### Method 2: Compile & Build Locally (Docker Compose)
To compile the source code from scratch:

1. Clone this repository and open a terminal in the root directory.
2. Build and start:
```bash
docker compose up -d --build
```
3. Access:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8080](http://localhost:8080)

---

## 📡 REST API Documentation

Every REST response includes a custom `time_ns` header measuring execution processing times.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/geofences` | `POST` | Create a new polygon boundary perimeter. |
| `/api/geofences` | `GET` | List all geofences (supports `?category=` filter). |
| `/api/geofences/:id`| `DELETE`| Remove a geofence definition. |
| `/api/vehicles` | `POST` | Register a new vehicle to the fleet. |
| `/api/vehicles` | `GET` | Retrieve registered fleet vehicles. |
| `/api/locations` | `POST` | Post coordinate telemetry update (triggers alerts & logs violations). |
| `/api/vehicles/location/:vehicle_id` | `GET` | Get current location and containing zone data. |
| `/api/alerts/configure` | `POST` | Set a rule trigger to monitor transitions. |
| `/api/violations/history` | `GET` | Retrieve historical logs (supports pagination and filtering). |
