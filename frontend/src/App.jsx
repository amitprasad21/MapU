import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Geofences from './pages/Geofences';
import Vehicles from './pages/Vehicles';
import AlertRules from './pages/AlertRules';
import LiveTracking from './pages/LiveTracking';
import ViolationHistory from './pages/ViolationHistory';
import useWebSocket from './hooks/useWebSocket';
import { AlertTriangle, Bell, CheckCircle, X } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Callback when WebSocket alert is received from backend
  const handleAlert = (alert) => {
    // Add to live alerts ticker list (keep last 100 in memory)
    setLiveAlerts(prev => [alert, ...prev].slice(0, 100));

    // Add to visual toast list
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...alert }]);

    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  // Connect to websocket
  const isWsConnected = useWebSocket(handleAlert);

  return (
    <DashboardLayout isWsConnected={isWsConnected}>
      {/* Route Views */}
      <Routes>
        <Route path="/" element={<Dashboard liveAlerts={liveAlerts} />} />
        <Route path="/geofences" element={<Geofences />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/alerts" element={<AlertRules />} />
        <Route path="/tracking" element={<LiveTracking />} />
        <Route path="/violations" element={<ViolationHistory />} />
      </Routes>

      {/* Floating Stack of Toasts (Top Right Corner) */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-lg flex items-start justify-between gap-3 text-slate-800 animate-slide-in border bg-white shadow-slate-200/50 ${
              toast.event_type === 'entry'
                ? 'border-l-4 border-l-emerald-600 border-slate-200/80'
                : 'border-l-4 border-l-rose-600 border-slate-200/80'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-xl border mt-0.5 ${
                toast.event_type === 'entry' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
              </div>
              
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${
                  toast.event_type === 'entry' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {toast.event_type === 'entry' ? 'Geofence Entry Alert' : 'Geofence Exit Alert'}
                </p>
                <h4 className="text-sm font-extrabold text-slate-800 mt-0.5">
                  {toast.vehicle?.vehicle_number}
                </h4>
                <p className="text-xs text-slate-650 mt-1 leading-normal">
                  Driver <span className="font-semibold text-slate-800">{toast.vehicle?.driver_name}</span> has {toast.event_type === 'entry' ? 'entered' : 'exited'} the zone <span className="font-bold text-slate-800">{toast.geofence?.geofence_name}</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-750 transition shrink-0 p-1 hover:bg-slate-100 rounded-lg border border-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}
