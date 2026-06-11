import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Truck, 
  Bell, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Settings, 
  MapPin,
  Menu,
  X
} from 'lucide-react';

export const DashboardLayout = ({ children, isWsConnected }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Live Tracking', href: '/tracking', icon: MapPin },
    { name: 'Geofences', href: '/geofences', icon: Map },
    { name: 'Vehicles', href: '/vehicles', icon: Truck },
    { name: 'Alert Rules', href: '/alerts', icon: Settings },
    { name: 'Violation History', href: '/violations', icon: AlertTriangle },
  ];

  return (
    <div className="relative flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Background Glowing Blobs for Premium Light Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[25%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none z-0" />
      
      {/* Sidebar - Solid White Rounded Panel */}
      <aside className="m-4 mr-0 w-64 bento-panel rounded-2xl flex flex-col justify-between hidden md:flex z-40 relative">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 shrink-0">
            <div className="bg-emerald-800 text-white p-2 rounded-xl shadow-md shadow-emerald-800/10">
              <MapPin className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-800 leading-none">GeoAlert</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Control Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 mt-6 px-3 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-50/80 text-emerald-800 border-l-4 border-emerald-800 shadow-sm shadow-emerald-700/5 backdrop-blur-sm'
                      : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 hover:shadow-sm'
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* WebSocket Status Indicator */}
        <div className="p-3 border-t border-slate-200/50 bg-white/20 shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
            isWsConnected 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-5 border-rose-100 text-rose-700'
          }`}>
            <div className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isWsConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isWsConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold">
                {isWsConnected ? 'System Online' : 'Connecting...'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-30">
        {/* Floating Header */}
        <header className="m-4 mb-0 h-16 bento-panel rounded-2xl px-6 flex items-center justify-between shrink-0 relative z-40">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-800 text-white p-1.5 rounded-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <h1 className="font-bold text-sm text-slate-850">GeoAlert</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Control Console</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Dashboard Clock</p>
              <p className="text-xs font-bold text-slate-600">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Mobile Connection Dot */}
            <div className="md:hidden">
              <span className={`flex h-2 w-2 relative`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isWsConnected ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isWsConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="mx-4 mt-1 p-3 bento-panel rounded-2xl md:hidden absolute top-16 left-0 right-0 z-50 space-y-1 animate-slide-in">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl ${
                    isActive
                      ? 'bg-slate-100 text-emerald-800 border-l-4 border-emerald-800'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.name}
              </NavLink>
            ))}
          </div>
        )}

        {/* Main View scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative z-30">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
