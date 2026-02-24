import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Map, 
  ClipboardCheck, 
  AlertTriangle, 
  LogOut,
  Settings
} from 'lucide-react';

// Renamed function to LogisticsSideBar to match your file name 'LogisticsSideBar.jsx'
export default function LogisticsSideBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Fleet Overview', icon: LayoutDashboard, path: '/logistics/dashboard' },
    { name: 'Active Dispatches', icon: Truck, path: '/logistics/active' },
    { name: 'Live Route Map', icon: Map, path: '/logistics/map' },
    { name: 'Handover Logs', icon: ClipboardCheck, path: '/logistics/logs' },
    { name: 'Incident Reports', icon: AlertTriangle, path: '/logistics/incident' },
    { name: 'Settings', icon: Settings, path: '/logistics/settings' }
  ];

  return (
    <div className="fixed left-6 top-32 bottom-8 w-64 glass-panel rounded-[3rem] p-8 flex flex-col z-50">
      <div className="mb-10 px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Transport Command</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/50 text-primary/60'
              }`}
            >
              <Icon size={20} />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-primary/5 space-y-2">
        <button onClick={() => navigate('/')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50">
          <LogOut size={20} /> Exit Portal
        </button>
      </div>
    </div>
  );
}