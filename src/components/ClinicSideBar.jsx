import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Search, 
  Calendar, 
  Activity, 
  ShieldCheck, 
  LogOut,
  Zap,
  CreditCard
} from 'lucide-react';
import '../App.css';

export default function ClinicSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/clinic/dashboard' },
    { name: 'Find Equipment', icon: Search, path: '/clinic/search' },
    { name: 'My Bookings', icon: Calendar, path: '/clinic/booking' },
    { name: 'Live Tracking', icon: Activity, path: '/clinic/tracking' },
    { name: 'Payments', icon: CreditCard, path: '/clinic/payment' },
    { name: 'Verification', icon: ShieldCheck, path: '/clinic/register' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-72 p-6 z-[60] hidden lg:block">
      <div className="glass-panel h-full w-full rounded-[3rem] flex flex-col overflow-hidden border-r border-white/10">
        
        {/* LOGO SPACE (Pushed down to avoid overlapping the flying logo) */}
        <div className="p-10 pt-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-[8px] font-black uppercase text-secondary tracking-widest mb-2">
            <Zap size={10} fill="currentColor" />
            Partner Portal
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 group ${
                  isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                  : "text-primary/40 hover:text-primary hover:bg-white/40"
                }`}
              >
                <item.icon size={20} className={`${isActive ? "text-secondary" : "group-hover:text-secondary"} transition-colors`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* USER PROFILE CARD */}
        <div className="p-6">
          <div className="glass-panel bg-primary text-white p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-black">
                C1
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black truncate">City General</p>
                <p className="text-[10px] font-bold opacity-40">Tier: Elite Partner</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

