import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Polygon, useMapEvents, Tooltip, useMap } from 'react-leaflet';
import api from '../api/axios';
import { 
  Trash2, 
  Layers, 
  Info, 
  Plus, 
  Check, 
  RotateCcw,
  Navigation,
  Compass
} from 'lucide-react';

const CATEGORY_COLORS = {
  restricted_zone: { fill: '#f43f5e', border: '#e11d48', label: 'Restricted' },
  delivery_zone: { fill: '#3b82f6', border: '#2563eb', label: 'Delivery' },
  toll_zone: { fill: '#f59e0b', border: '#d97706', label: 'Toll' },
  customer_area: { fill: '#10b981', border: '#059669', label: 'Customer' }
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
};

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  if (center) {
    map.setView(center, zoom);
  }
  return null;
};

export const Geofences = () => {
  const queryClient = useQueryClient();
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('delivery_zone');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [mapZoom, setMapZoom] = useState(13);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch geofences list
  const { data, isLoading } = useQuery({
    queryKey: ['geofences', selectedCategoryFilter],
    queryFn: () => api.get(`/geofences${selectedCategoryFilter ? `?category=${selectedCategoryFilter}` : ''}`).then(res => res.data),
  });

  const geofences = data?.geofences || [];

  // Create geofence mutation
  const createMutation = useMutation({
    mutationFn: (newGeofence) => api.post('/geofences', newGeofence),
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      setDrawnPoints([]);
      setName('');
      setDescription('');
      setCategory('delivery_zone');
      setSuccessMsg('Geofence created successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to create geofence');
    }
  });

  // Delete geofence mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/geofences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      setSuccessMsg('Geofence deleted successfully');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to delete geofence');
    }
  });

  const handleMapClick = (latlng) => {
    setDrawnPoints(prev => [...prev, latlng]);
  };

  const handleClearPoints = () => {
    setDrawnPoints([]);
    setErrorMsg('');
  };

  const handleZoomToGeofence = (g) => {
    if (g.coordinates && g.coordinates.length > 0) {
      let latSum = 0;
      let lngSum = 0;
      g.coordinates.forEach(pt => {
        latSum += pt[0];
        lngSum += pt[1];
      });
      const avgLat = latSum / g.coordinates.length;
      const avgLng = lngSum / g.coordinates.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(14);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (drawnPoints.length < 3) {
      setErrorMsg('Please click map background to place at least 3 points.');
      return;
    }

    let coordinates = [...drawnPoints];
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first);
    }

    createMutation.mutate({
      name,
      description,
      category,
      coordinates
    });
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this geofence?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="h-[calc(100vh-130px)] md:h-[calc(100vh-100px)] relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm animate-slide-in">
      
      {/* Full-screen Leaflet Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="h-full w-full"
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />
          
          {/* Currently placing points */}
          {drawnPoints.length > 0 && (
            <Polygon 
              positions={drawnPoints} 
              pathOptions={{ color: '#065f46', fillColor: '#065f46', fillOpacity: 0.15, weight: 3 }}
            />
          )}

          {/* Existing geofences */}
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
        </MapContainer>

        {/* Clear points control floating over map */}
        {drawnPoints.length > 0 && (
          <div className="absolute bottom-4 left-4 z-[400] flex gap-2 pointer-events-auto">
            <button
              onClick={handleClearPoints}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Drawing
            </button>
            <div className="bg-emerald-800 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 border border-emerald-900/10">
              <Navigation className="w-3.5 h-3.5" />
              Vertices: {drawnPoints.length}
            </div>
          </div>
        )}
      </div>

      {/* Floating Header HUD */}
      <div className="absolute top-4 left-4 z-[400] bento-panel px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-slate-800 pointer-events-auto">
        <Compass className="w-4 h-4 text-emerald-800 animate-spin-slow" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Perimeter Mapping Engine</span>
      </div>

      {/* Floating Control Deck Left (Create Geofence Form) */}
      <div className="absolute top-16 left-4 z-[400] w-80 bento-panel border border-slate-200 p-5 rounded-2xl shadow-md max-h-[calc(100vh-230px)] overflow-y-auto flex flex-col gap-4 pointer-events-auto">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus className="w-4.5 h-4.5 text-emerald-800" />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Draw Geofence</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Zone Name</label>
            <input
              type="text"
              placeholder="e.g. Restricted Terminal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bento-input"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              placeholder="Operational instructions for this zone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bento-input h-16 resize-none py-2"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bento-input py-2 text-xs"
            >
              <option value="delivery_zone">Delivery Zone</option>
              <option value="restricted_zone">Restricted Zone</option>
              <option value="toll_zone">Toll Zone</option>
              <option value="customer_area">Customer Area</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="w-full bento-button-primary py-2.5"
          >
            {createMutation.isLoading ? 'Saving Zone...' : 'Save Perimeter'}
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-semibold flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 animate-pulse" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Floating Control Deck Right (Active Geofences list) */}
      <div className="absolute top-4 right-4 z-[400] w-80 bento-panel border border-slate-200 p-5 rounded-2xl shadow-md max-h-[calc(100vh-180px)] overflow-y-auto flex flex-col gap-4 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Active Zones ({geofences.length})</h3>
          
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] text-slate-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="delivery_zone">Delivery</option>
            <option value="restricted_zone">Restricted</option>
            <option value="toll_zone">Toll</option>
            <option value="customer_area">Customer</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
          {isLoading ? (
            <div className="text-center py-6 text-slate-500 text-xs">Loading zones...</div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">No perimeters found</div>
          ) : (
            geofences.map((g) => {
              const colors = CATEGORY_COLORS[g.category] || { fill: '#64748b', border: '#475569', label: 'Other' };
              return (
                <div
                  key={g.id}
                  onClick={() => handleZoomToGeofence(g)}
                  className="p-3 bg-white/40 hover:bg-white/90 border border-slate-200/50 shadow-sm rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition duration-200"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0 border" 
                      style={{ backgroundColor: colors.fill, borderColor: colors.border }}
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{g.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">{colors.label}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(g.id, e)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Geofences;
