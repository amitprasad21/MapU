import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Bell, 
  Map, 
  Truck, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Info,
  Sliders,
  Settings
} from 'lucide-react';

export const AlertRules = () => {
  const queryClient = useQueryClient();
  const [geofenceId, setGeofenceId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [eventType, setEventType] = useState('both');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch geofences for selector
  const { data: geofencesData } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => api.get('/geofences').then(res => res.data),
  });
  const geofences = geofencesData?.geofences || [];

  // Fetch vehicles for selector
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(res => res.data),
  });
  const vehicles = vehiclesData?.vehicles || [];

  // Fetch configured rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => api.get('/alerts').then(res => res.data),
  });
  const rules = rulesData?.alerts || [];

  // Create rule mutation
  const createMutation = useMutation({
    mutationFn: (newRule) => api.post('/alerts/configure', newRule),
    onSuccess: () => {
      queryClient.invalidateQueries(['alertRules']);
      setGeofenceId('');
      setVehicleId('');
      setEventType('both');
      setSuccessMsg('Alert rule configured successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to configure alert rule');
    }
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alertRules']);
      setSuccessMsg('Alert rule deleted successfully');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to delete alert rule');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!geofenceId) {
      setErrorMsg('Please select a geofence zone.');
      return;
    }

    createMutation.mutate({
      geofence_id: geofenceId,
      vehicle_id: vehicleId || undefined,
      event_type: eventType
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-in">
      {/* Title block */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Alert Configuration</h1>
        <p className="text-slate-500 text-xs mt-1">Configure warning triggers to dispatch push notifications on perimeter crossings.</p>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Column: Config Form (Col Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-start gap-2.5">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bento-panel border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-emerald-800" />
              New Alert Rule
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Geofence</label>
                <select
                  value={geofenceId}
                  onChange={(e) => setGeofenceId(e.target.value)}
                  className="bento-input py-2.5 text-xs"
                  required
                >
                  <option value="">-- Select Geofence --</option>
                  {geofences.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.category.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monitor Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="bento-input py-2.5 text-xs"
                >
                  <option value="">All Vehicles (Global Rule)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Trigger Event</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="bento-input py-2.5 text-xs"
                >
                  <option value="both">Both (Entry & Exit)</option>
                  <option value="entry">Entry Only</option>
                  <option value="exit">Exit Only</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="w-full bento-button-primary py-2.5"
              >
                {createMutation.isLoading ? 'Configuring...' : 'Enable Alert Rule'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Rules Table (Col Span 8) */}
        <div className="lg:col-span-8">
          <div className="bento-panel border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-100/30">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Active Alarm Configurations ({rules.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-slate-50">
                    <th className="px-6 py-4">Rule ID</th>
                    <th className="px-6 py-4">Geofence Zone</th>
                    <th className="px-6 py-4">Monitored Vehicle</th>
                    <th className="px-6 py-4">Event Trigger</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400 text-xs animate-pulse">Loading alert rules...</td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 text-xs font-semibold">
                        No configured alert rules found.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.alert_id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{rule.alert_id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Map className="w-3.5 h-3.5 text-slate-450" />
                            {rule.geofence_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {rule.vehicle_number ? (
                            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <Truck className="w-3.5 h-3.5 text-slate-450" />
                              {rule.vehicle_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">All Fleet (Global)</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                            rule.event_type === 'both' 
                              ? 'bg-purple-50 border-purple-100 text-purple-705' 
                              : rule.event_type === 'entry'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-rose-55 border-rose-100/70 text-rose-600'
                          }`}>
                            {rule.event_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 border-emerald-100 text-emerald-700">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            {rule.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(rule.alert_id)}
                            className="bg-rose-55 hover:bg-rose-100/50 text-rose-600 p-1.5 rounded-lg border border-rose-200 transition inline-flex items-center align-middle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AlertRules;
