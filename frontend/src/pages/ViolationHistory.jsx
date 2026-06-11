import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  AlertTriangle, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw 
} from 'lucide-react';

export const ViolationHistory = () => {
  const [vehicleId, setVehicleId] = useState('');
  const [geofenceId, setGeofenceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch vehicles for filter dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(res => res.data),
  });
  const vehicles = vehiclesData?.vehicles || [];

  // Fetch geofences for filter dropdown
  const { data: geofencesData } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => api.get('/geofences').then(res => res.data),
  });
  const geofences = geofencesData?.geofences || [];

  // Construct query URL
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (vehicleId) queryParams.append('vehicle_id', vehicleId);
  if (geofenceId) queryParams.append('geofence_id', geofenceId);
  if (startDate) queryParams.append('start_date', new Date(startDate).toISOString());
  if (endDate) queryParams.append('end_date', new Date(endDate).toISOString());

  // Fetch history list
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['violationsHistory', vehicleId, geofenceId, startDate, endDate, page],
    queryFn: () => api.get(`/violations/history?${queryParams.toString()}`).then(res => res.data),
    keepPreviousData: true,
  });

  const violations = data?.violations || [];
  const totalCount = data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleResetFilters = () => {
    setVehicleId('');
    setGeofenceId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (violations.length === 0) return;

    const headers = ['ID', 'Vehicle Number', 'Geofence Name', 'Event Type', 'Latitude', 'Longitude', 'Timestamp'];
    const rows = violations.map(v => [
      v.id,
      v.vehicle_number,
      v.geofence_name,
      v.event_type.toUpperCase(),
      v.latitude,
      v.longitude,
      v.timestamp
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `violations_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Violation Logs</h1>
          <p className="text-slate-505 text-xs mt-1">Audit log records of perimeter warning crossings.</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={violations.length === 0}
          className="bento-button-secondary py-2 flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-emerald-800" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bento-panel border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-805 font-bold text-xs uppercase tracking-widest">
          <Filter className="w-4 h-4 text-emerald-800" />
          <span>Filter Telemetry Logs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fleet Asset</label>
            <select
              value={vehicleId}
              onChange={(e) => { setVehicleId(e.target.value); setPage(1); }}
              className="bento-input py-2 text-xs"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Geofence Zone</label>
            <select
              value={geofenceId}
              onChange={(e) => { setGeofenceId(e.target.value); setPage(1); }}
              className="bento-input py-2 text-xs"
            >
              <option value="">All Geofences</option>
              {geofences.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bento-input py-2 text-xs text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
              className="bento-input py-2 text-xs text-slate-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleResetFilters}
            className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Clear Filters
          </button>
          
          <button
            onClick={() => refetch()}
            className="bento-button-secondary py-1.5 px-4"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="bento-panel border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-slate-100/30">
                <th className="px-6 py-4">Event ID</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Geofence Crossed</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 text-xs animate-pulse">Loading logs...</td>
                </tr>
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No violation events found.
                  </td>
                </tr>
              ) : (
                violations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{v.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{v.vehicle_number}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{v.geofence_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                        v.event_type === 'entry' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-rose-50 border-rose-100/70 text-rose-600'
                      }`}>
                        {v.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                      [{v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}]
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(v.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/50 flex items-center justify-between bg-white/20">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} logs
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="text-[10px] text-slate-700 font-bold uppercase tracking-widest flex items-center px-2">
                Page {page} of {totalPages}
              </div>

              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViolationHistory;
