import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import { 
  Play, 
  Map as MapIcon, 
  Truck, 
  Layers, 
  Info, 
  Send,
  Navigation,
  Compass,
  AlertCircle
} from 'lucide-react';

const CATEGORY_COLORS = {
  restricted_zone: { fill: '#f43f5e', border: '#e11d48', label: 'Restricted Zone' },
  delivery_zone: { fill: '#3b82f6', border: '#2563eb', label: 'Delivery Zone' },
  toll_zone: { fill: '#f59e0b', border: '#d97706', label: 'Toll Zone' },
  customer_area: { fill: '#10b981', border: '#059669', label: 'Customer Area' }
};

const getVehicleIcon = (vehicleType) => {
  let svgPath = '';
  if (vehicleType === 'car') {
    svgPath = `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>`;
  } else if (vehicleType === 'motorcycle') {
    svgPath = `<circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M12 18V8a2 2 0 0 0-2-2H6M16 18c-1.5-2-3-4-5-4h-2M15 6h4"/>`;
  } else {
    svgPath = `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>`;
  }

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
        </div>
        <div class="bg-white border-2 border-emerald-800 text-emerald-800 p-1.5 rounded-full shadow-md flex items-center justify-center w-8 h-8 hover:bg-emerald-800 hover:text-white transition duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${svgPath}
          </svg>
        </div>
      </div>`,
    className: 'custom-vehicle-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const SimulatorMapClick = ({ onSelectCoords }) => {
  useMapEvents({
    click(e) {
      onSelectCoords([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
};

export const LiveTracking = () => {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [simulatorCoords, setSimulatorCoords] = useState(null);
  const [currentGeofenceInside, setCurrentGeofenceInside] = useState([]);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch geofences to display as polygons
  const { data: geofencesData } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => api.get('/geofences').then(res => res.data),
  });
  const geofences = geofencesData?.geofences || [];

  // Fetch vehicles for dropdown selector
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(res => res.data),
  });
  const vehicles = vehiclesData?.vehicles || [];

  // Fetch current locations of all vehicles - auto poll every 5 seconds
  const { data: locationsData, refetch: refetchLocations } = useQuery({
    queryKey: ['vehicleLocations'],
    queryFn: () => api.get('/api/vehicles/locations').then(res => res.data),
    refetchInterval: 5000,
  });
  const currentLocations = locationsData?.locations || [];

  // Submit manual location simulation mutation
  const locationMutation = useMutation({
    mutationFn: (locationPayload) => api.post('/api/locations', locationPayload).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['vehicleLocations']);
      refetchLocations();
      
      const insideGeofences = data.current_geofences || [];
      setCurrentGeofenceInside(insideGeofences);

      if (insideGeofences.length > 0) {
        const zoneNames = insideGeofences.map(g => g.geofence_name).join(', ');
        setInfoMessage(`Location broadcasted! Vehicle is inside: ${zoneNames}`);
      } else {
        setInfoMessage('Location broadcasted! Vehicle is in open airspace.');
      }
      setErrorMessage('');
      setSimulatorCoords(null);
      setTimeout(() => setInfoMessage(''), 6000);
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to send simulation coordinate');
      setInfoMessage('');
    }
  });

  const handleSendSimulation = () => {
    if (!selectedVehicleId) {
      setErrorMessage('Please select a vehicle to simulate.');
      return;
    }
    if (!simulatorCoords) {
      setErrorMessage('Please click on the map to select target coordinates.');
      return;
    }

    locationMutation.mutate({
      vehicle_id: selectedVehicleId,
      latitude: simulatorCoords[0],
      longitude: simulatorCoords[1],
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="h-[calc(100vh-130px)] md:h-[calc(100vh-100px)] relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm animate-slide-in">
      
      {/* Full-screen Leaflet Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={[37.7749, -122.4194]} 
          zoom={13} 
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Draw geofences */}
          {geofences.map((g) => {
            const colors = CATEGORY_COLORS[g.category] || { fill: '#94a3b8', border: '#64748b' };
            return (
              <Polygon
                key={g.id}
                positions={g.coordinates}
                pathOptions={{ color: colors.border, fillColor: colors.fill, fillOpacity: 0.12, weight: 2 }}
              >
                <Tooltip sticky className="custom-tooltip">
                  <div>
                    <p className="font-bold text-xs text-slate-800">{g.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{g.category.replace('_', ' ')}</p>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

          {/* Draw vehicle markers */}
          {currentLocations.map((loc) => {
            const vehicle = vehicles.find(v => v.id === loc.vehicle_id);
            if (!vehicle) return null;

            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={getVehicleIcon(vehicle.vehicle_type)}
              >
                <Tooltip sticky className="custom-tooltip">
                  <div>
                    <p className="font-bold text-xs text-slate-800">{vehicle.vehicle_number}</p>
                    <p className="text-[10px] text-slate-600">Driver: {vehicle.driver_name}</p>
                    <p className="text-[9px] text-slate-450">Lat: {loc.latitude.toFixed(4)}, Lng: {loc.longitude.toFixed(4)}</p>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

          {/* Simulator Click Handler */}
          <SimulatorMapClick onSelectCoords={(latlng) => setSimulatorCoords(latlng)} />
          {simulatorCoords && (
            <Marker 
              position={simulatorCoords}
              icon={L.divIcon({
                html: `<div class="bg-rose-500 border-2 border-white text-white p-1 rounded-full shadow-md animate-bounce flex items-center justify-center w-6 h-6"><span class="w-2 h-2 rounded-full bg-white"></span></div>`,
                className: 'custom-simulation-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            />
          )}
        </MapContainer>
      </div>

      {/* Floating Header HUD / Status Bar */}
      <div className="absolute top-4 left-4 z-[400] bento-panel px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-slate-800 pointer-events-auto">
        <Compass className="w-4 h-4 text-emerald-800 animate-spin-slow" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">System Telemetry Online</span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Floating Telemetry Simulator Deck (Right Sidebar HUD) */}
      <div className="absolute top-4 right-4 z-[400] w-80 bento-panel border border-slate-200 p-5 rounded-2xl shadow-md max-h-[calc(100vh-180px)] overflow-y-auto flex flex-col gap-4 pointer-events-auto text-slate-850">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Play className="w-4.5 h-4.5 text-emerald-800" />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Movement Simulator</h3>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Select a vehicle, click anywhere on the background map to choose coordinates, and send an update.
        </p>

        {/* Form elements */}
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Fleet Asset</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                setSimulatorCoords(null);
              }}
              className="bento-input py-2 text-xs"
            >
              <option value="">-- Select Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Simulation Target</label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono flex items-center justify-between">
              {simulatorCoords ? (
                <span className="text-emerald-800 font-semibold">
                  [{simulatorCoords[0].toFixed(5)}, {simulatorCoords[1].toFixed(5)}]
                </span>
              ) : (
                <span className="text-slate-400">Click map background</span>
              )}
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <button
            onClick={handleSendSimulation}
            disabled={locationMutation.isLoading || !selectedVehicleId || !simulatorCoords}
            className="w-full bento-button-primary py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{locationMutation.isLoading ? 'Sending...' : 'Broadcast Location'}</span>
          </button>
        </div>

        {/* Feedback messages inside HUD panel */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold flex items-start gap-2">
            <Compass className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* HUD: Current active perimeter crossings */}
        {currentGeofenceInside.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Containing Boundaries</label>
            <div className="space-y-1.5">
              {currentGeofenceInside.map((g) => (
                <div key={g.geofence_id} className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-850 rounded-lg text-[10px] font-bold flex justify-between items-center uppercase tracking-wide">
                  <span>{g.geofence_name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-800 text-white font-extrabold text-[8px]">INSIDE</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
