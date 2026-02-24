import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CalendarClock, 
  ShieldCheck, 
  TrendingUp, 
  BarChart3,
  Truck,
  Wallet,
  LogOut,
  Zap
} from 'lucide-react';

export default function OwnerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Control Center', icon: LayoutDashboard, path: '/owner/dashboard' },
    { name: 'Add Equipment', icon: PlusCircle, path: '/owner/add' },
    { name: 'Booking Requests', icon: CalendarClock, path: '/owner/requests' },
    { name: 'Certification Vault', icon: ShieldCheck, path: '/owner/vault' },
    { name: 'Yield Strategy', icon: TrendingUp, path: '/owner/yield' },
    { name: 'Asset Intelligence', icon: BarChart3, path: '/owner/analytics' },
    { name: 'Deployment Logs', icon: Truck, path: '/owner/dispatch' },
    { name: 'Settlement Registry', icon: Wallet, path: '/owner/settlements' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-72 p-6 z-[60] hidden lg:block">
      <div className="glass-panel h-full w-full rounded-[3rem] flex flex-col overflow-hidden border-r border-white/10">
        
        {/* LOGO SPACE (Matches your pt-32) */}
        <div className="p-10 pt-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-[8px] font-black uppercase text-primary border border-primary/10 tracking-widest mb-2">
            <Zap size={10} className="text-secondary" fill="currentColor" />
            Owner Protocol
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 group ${
                  isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                  : "text-primary/40 hover:text-primary hover:bg-white/40"
                }`}
              >
                <item.icon size={18} className={`${isActive ? "text-secondary" : "group-hover:text-secondary"} transition-colors`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* OWNER PROFILE CARD */}
        <div className="p-6">
          <div className="glass-panel bg-primary text-white p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-black">
                OP
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black truncate">Nexus Medical</p>
                <p className="text-[10px] font-bold opacity-40 uppercase">Fleet Owner</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut size={14} /> Terminate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}