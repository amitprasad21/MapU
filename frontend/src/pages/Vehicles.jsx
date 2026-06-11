import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Truck, 
  User, 
  Phone, 
  Trash2, 
  Plus, 
  Check, 
  Info,
  Car,
  Settings
} from 'lucide-react';

export const Vehicles = () => {
  const queryClient = useQueryClient();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleType, setVehicleType] = useState('truck');
  const [phone, setPhone] = useState('');
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch vehicles
  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(res => res.data),
  });

  const vehicles = data?.vehicles || [];

  // Create vehicle mutation
  const createMutation = useMutation({
    mutationFn: (newVehicle) => api.post('/vehicles', newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setVehicleNumber('');
      setDriverName('');
      setPhone('');
      setVehicleType('truck');
      setSuccessMsg('Vehicle registered successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to register vehicle');
    }
  });

  // Update vehicle mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }) => api.put(`/vehicles/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setEditingVehicle(null);
      setSuccessMsg('Vehicle updated successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update vehicle');
    }
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      setSuccessMsg('Vehicle deleted successfully');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to delete vehicle');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVehicle) {
      updateMutation.mutate({
        id: editingVehicle.id,
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        vehicle_type: vehicleType,
        phone,
        status: editingVehicle.status
      });
    } else {
      createMutation.mutate({
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        vehicle_type: vehicleType,
        phone
      });
    }
  };

  const handleEdit = (v) => {
    setEditingVehicle(v);
    setVehicleNumber(v.vehicle_number);
    setDriverName(v.driver_name);
    setVehicleType(v.vehicle_type);
    setPhone(v.phone);
  };

  const handleCancelEdit = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setDriverName('');
    setPhone('');
    setVehicleType('truck');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-in">
      {/* Title block */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Vehicle Management</h1>
        <p className="text-slate-505 text-xs mt-1">Register new fleet transit assets and edit driver profile details.</p>
      </div>

      {/* Grid Layout: form on Left, table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Column: Register Form (Col Span 4) */}
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
              {editingVehicle ? (
                <>
                  <Settings className="w-4.5 h-4.5 text-amber-605 animate-spin" />
                  Edit Vehicle
                </>
              ) : (
                <>
                  <Plus className="w-4.5 h-4.5 text-emerald-800" />
                  Register Vehicle
                </>
              )}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vehicle Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                    <Car className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="bento-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Driver Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="bento-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Driver Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. +1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bento-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="bento-input py-2.5 text-xs"
                >
                  <option value="truck">Truck</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                {editingVehicle && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bento-button-secondary"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bento-button-primary"
                >
                  {editingVehicle ? 'Update' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Registered Vehicles Table (Col Span 8) */}
        <div className="lg:col-span-8">
          <div className="bento-panel border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-100/30">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Active Fleet Directory ({vehicles.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-slate-50">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Vehicle Number</th>
                    <th className="px-6 py-4">Driver Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400 text-xs animate-pulse">Loading fleet data...</td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400 text-xs font-semibold">
                        No registered vehicles found.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{v.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{v.vehicle_number}</td>
                        <td className="px-6 py-4 text-slate-605 font-semibold">{v.driver_name}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{v.phone}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            {v.vehicle_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            v.status === 'active' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              v.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {v.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 shrink-0">
                          <button
                            onClick={() => handleEdit(v)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition uppercase tracking-wider"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
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

export default Vehicles;
