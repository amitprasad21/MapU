import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Truck, 
  Map, 
  AlertOctagon, 
  Settings, 
  Bell, 
  TrendingUp,
  Clock,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = ({ liveAlerts }) => {
  // Fetch vehicles
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(res => res.data),
  });

  // Fetch geofences
  const { data: geofencesData, isLoading: loadingGeofences } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => api.get('/geofences').then(res => res.data),
  });

  // Fetch alerts rules
  const { data: alertsData, isLoading: loadingAlertRules } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => api.get('/alerts').then(res => res.data),
  });

  // Fetch violations count
  const { data: violationsData, isLoading: loadingViolations } = useQuery({
    queryKey: ['violationsToday'],
    queryFn: () => api.get('/violations/history?limit=1').then(res => res.data),
  });

  const stats = [
    {
      name: 'Total Vehicles',
      value: vehiclesData?.vehicles?.length ?? 0,
      loading: loadingVehicles,
      icon: Truck,
      isPrimary: true, // Forest Green highlight
      color: 'bg-gradient-to-br from-emerald-800 to-emerald-950 text-white border-emerald-700/25 shadow-lg shadow-emerald-850/15',
      iconColor: 'bg-white/10 text-white',
      link: '/vehicles'
    },
    {
      name: 'Total Geofences',
      value: geofencesData?.geofences?.length ?? 0,
      loading: loadingGeofences,
      icon: Map,
      isPrimary: false,
      color: 'bg-white/20 backdrop-blur-md text-slate-800 border-white/50 shadow-md shadow-slate-200/15 hover:bg-white/50',
      iconColor: 'bg-white/35 text-slate-650',
      link: '/geofences'
    },
    {
      name: 'Active Alert Rules',
      value: alertsData?.alerts?.length ?? 0,
      loading: loadingAlertRules,
      icon: Settings,
      isPrimary: false,
      color: 'bg-white/20 backdrop-blur-md text-slate-800 border-white/50 shadow-md shadow-slate-200/15 hover:bg-white/50',
      iconColor: 'bg-white/35 text-slate-650',
      link: '/alerts'
    },
    {
      name: 'All-Time Violations',
      value: violationsData?.total_count ?? 0,
      loading: loadingViolations,
      icon: AlertOctagon,
      isPrimary: false,
      color: 'bg-white/20 backdrop-blur-md text-slate-800 border-white/50 shadow-md shadow-slate-200/15 hover:bg-white/50',
      iconColor: 'bg-white/35 text-slate-650',
      link: '/violations'
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bento-panel bg-gradient-to-br from-white/80 to-white/40 p-6 rounded-2xl border border-white/70 shadow-lg shadow-slate-200/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-xs mt-1">Real-time point-in-polygon vehicle tracking and perimeter crossing warnings.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-250/80 text-[10px] font-bold text-slate-500 w-fit">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="uppercase tracking-widest">Active Monitor</span>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={stat.name} 
              to={stat.link}
              className={`block relative overflow-hidden border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-slate-200/60 ${stat.color} group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${stat.isPrimary ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {stat.name}
                  </p>
                  {stat.loading ? (
                    <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2.5" />
                  ) : (
                    <h3 className="text-3xl font-extrabold tracking-tight mt-2">{stat.value}</h3>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${stat.iconColor} border border-slate-200/5`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold tracking-widest ${stat.isPrimary ? 'text-emerald-100' : 'text-slate-400'} group-hover:underline`}>
                  Open Console
                </span>
                <ArrowUpRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${stat.isPrimary ? 'text-emerald-200' : 'text-slate-400'}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Live Alert Feed & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Live WebSocket Alerts Ticker */}
        <div className="lg:col-span-2 bento-panel border border-slate-200/80 rounded-2xl flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Warning Log Ticker</h2>
                <p className="text-[10px] text-slate-400">WebSocket connection listening live for transitions</p>
              </div>
            </div>
            
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live HUD
            </span>
          </div>

          <div className="flex-1 min-h-[350px] max-h-[500px] overflow-y-auto p-6 space-y-3">
            {liveAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 py-20">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                  <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-bold text-sm text-slate-700">No Telemetry Events Logged</h3>
                <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-normal">
                  Go to **Live Tracking** and click on the map to trigger geofence warnings.
                </p>
              </div>
            ) : (
              liveAlerts.map((alert, index) => (
                <Link 
                  key={alert.event_id || index}
                  to="/tracking"
                  className={`block p-4 rounded-xl border transition duration-150 hover:bg-white/60 hover:shadow-sm animate-slide-in ${
                    alert.event_type === 'entry'
                      ? 'bg-emerald-50/20 border-emerald-100/60'
                      : 'bg-rose-50/20 border-rose-100/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 border ${
                        alert.event_type === 'entry' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-rose-50 border-rose-100 text-rose-700'
                      }`}>
                        <AlertOctagon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">
                            {alert.vehicle?.vehicle_number || 'Unknown Vehicle'}
                          </span>
                          <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold border ${
                            alert.event_type === 'entry'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-rose-50 border-rose-100 text-rose-700'
                          }`}>
                            {alert.event_type === 'entry' ? 'ENTERED' : 'EXITED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Geofence: <span className="font-semibold text-slate-800">{alert.geofence?.geofence_name}</span> 
                          <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-semibold">({alert.geofence?.category.replace('_', ' ')})</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Driver: {alert.vehicle?.driver_name || 'N/A'} • Coordinates: [{alert.location?.latitude.toFixed(5)}, {alert.location?.longitude.toFixed(5)}]
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-mono font-bold">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info/Status */}
        <div className="space-y-6">
          <div className="bento-panel border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-4">Boundary Categories</h3>
            <div className="space-y-3">
              {[
                { name: 'Restricted Zone', desc: 'Forbidden entry protocols', color: 'bg-rose-500 border-rose-650/10' },
                { name: 'Delivery Zone', desc: 'Client terminal bounds', color: 'bg-blue-500 border-blue-650/10' },
                { name: 'Toll Zone', desc: 'Tax gateway borders', color: 'bg-amber-500 border-amber-650/10' },
                { name: 'Customer Area', desc: 'Proximity arrival logs', color: 'bg-emerald-500 border-emerald-650/10' }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  to="/geofences"
                  className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-slate-200/30 hover:bg-white/80 hover:shadow-sm transition"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 border ${cat.color}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">{cat.name}</h4>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5">{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800/10 to-teal-850/5 border border-white/60 rounded-2xl p-6 shadow-sm bento-panel">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-2">Simulate Fleet</h3>
            <p className="text-xs text-slate-500 leading-normal mb-4">
              Access the live tracking simulator map, select any truck, and configure a mock coordinate to test Point-in-Polygon entry and exits.
            </p>
            <Link 
              to="/tracking" 
              className="w-full bento-button-primary"
            >
              <span>Fleet Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
