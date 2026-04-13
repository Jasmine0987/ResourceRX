import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Clock, CreditCard, Package, TrendingUp,
  Calendar, ChevronRight, Zap, CheckCircle2, AlertCircle,
  ShieldAlert, ArrowRight, BrainCircuit
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import '../../App.css';

const STATUS_STYLE = {
  "ACTIVE SESSION": { bg: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500 animate-pulse" },
  "IN TRANSIT":     { bg: "bg-blue-500/10 text-blue-600",       dot: "bg-blue-500 animate-pulse"    },
  "PENDING SETUP":  { bg: "bg-amber-500/10 text-amber-600",     dot: "bg-amber-400"                 },
  "COMPLETED":      { bg: "bg-gray-500/10 text-gray-500",       dot: "bg-gray-400"                  },
};

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { clinic, bookingHistory, currentBooking } = useClinic();

  const activeCount    = bookingHistory.filter(b => b.status === "ACTIVE SESSION").length;
  const transitCount   = bookingHistory.filter(b => b.status === "IN TRANSIT").length;
  const totalSpend     = bookingHistory.reduce((s, b) => s + (b.price || 0), 0);
  const completedCount = bookingHistory.filter(b => b.status === "COMPLETED").length;

  // Format INR spend correctly — ₹1,00,000 = ₹1L, not ₹1k
  const formatSpend = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const stats = [
    { label: "Active Bookings",    value: String(activeCount || bookingHistory.length), icon: Calendar,     color: "text-blue-500"   },
    { label: "In Transit",         value: String(transitCount),                         icon: Activity,     color: "text-emerald-500" },
    { label: "Total Spend",        value: formatSpend(totalSpend),                      icon: CreditCard,   color: "text-amber-500"  },
    { label: "Completed Sessions", value: String(completedCount),                       icon: CheckCircle2, color: "text-purple-500" },
  ];

  const goToTracking = (booking) => {
    if (booking.status === "IN TRANSIT" || booking.status === "ACTIVE SESSION") {
      navigate('/clinic/tracking');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-40 pb-20 px-6 max-w-7xl mx-auto">

      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4">
          <TrendingUp size={14} className="text-secondary" /> Network Performance: Optimal
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">
          Welcome, {clinic?.name || 'City General'}
        </h2>
        <p className="text-gray-500 font-bold tracking-tight uppercase text-xs tracking-[0.2em]">Infrastructure Command Center</p>
      </div>

      {/* In-progress booking banner */}
      {currentBooking && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass-panel border border-secondary/30 rounded-[2rem] p-6 flex items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
              <Zap size={20} />
            </div>
            <div>
              <p className="font-black text-sm">Booking in Progress: {currentBooking.asset}</p>
              <p className="text-[10px] font-bold opacity-50 uppercase">{currentBooking.status} · REF: {currentBooking.id}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (currentBooking.status === "PENDING PAYMENT") navigate('/clinic/payment');
              else navigate('/clinic/tracking');
            }}
            className="bg-secondary text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90"
          >
            Continue <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel p-8 rounded-[2.5rem] flex flex-col justify-between h-48"
          >
            <div className={`w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LIVE BOOKINGS FEED */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-[3rem] p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black tracking-tighter">Live Resource Feed</h3>
              <button onClick={() => navigate('/clinic/booking')} className="text-xs font-black uppercase text-secondary hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {bookingHistory.slice(0, 4).map((b) => {
                const s = STATUS_STYLE[b.status] || STATUS_STYLE["PENDING SETUP"];
                return (
                  <div
                    key={b.id}
                    onClick={() => goToTracking(b)}
                    className={`flex items-center gap-6 p-6 rounded-[2rem] hover:bg-white/30 transition-all border border-transparent hover:border-white/50 ${(b.status === "IN TRANSIT" || b.status === "ACTIVE SESSION") ? "cursor-pointer" : ""}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                      <div className={`w-3 h-3 rounded-full ${s.dot}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg tracking-tight">{b.asset}</p>
                      <p className="text-xs font-bold opacity-40 uppercase">REF: {b.id}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${s.bg}`}>{b.status}</span>
                      {b.price && (
                        <p className="text-xs font-bold opacity-40">
                          ₹{Number(b.price).toLocaleString('en-IN')}/hr
                        </p>
                      )}
                    </div>
                    {(b.status === "IN TRANSIT" || b.status === "ACTIVE SESSION") && (
                      <ChevronRight size={16} className="opacity-30" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MedGemma quick access */}
          <div className="glass-panel rounded-[2.5rem] p-8 flex items-center gap-6">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
              <BrainCircuit size={24} />
            </div>
            <div className="flex-1">
              <p className="font-black">Need help deciding what equipment you need?</p>
              <p className="text-xs opacity-50 font-bold">Ask MedGemma — the AI assistant available via the chat bubble →</p>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS SIDEBAR */}
        <div className="space-y-6">
          <div className="glass-panel bg-primary text-white p-10 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Package size={160} />
            </div>
            <h4 className="text-xs font-black uppercase text-secondary tracking-widest mb-6">Inventory Quick-Link</h4>
            <p className="text-xl font-bold mb-8 relative z-10 leading-tight">
              Need a specific modality for a patient tomorrow?
            </p>
            <button
              onClick={() => navigate('/clinic/search')}
              className="w-full bg-white text-primary py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-all"
            >
              Search Registry <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => navigate('/clinic/emergency')}
            className="w-full glass-panel border-2 border-red-400/30 p-6 rounded-[2rem] font-black text-sm flex items-center gap-4 hover:bg-red-50 hover:border-red-400/60 transition-all group"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div className="text-left">
              <p className="text-red-600 group-hover:text-red-700">Emergency Override</p>
              <p className="text-[10px] font-bold opacity-40 uppercase">Priority Dispatch</p>
            </div>
          </button>

          <div className="glass-panel p-8 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-5 text-center">Quick Actions</h4>
            <div className="space-y-3">
              {[
                { label: "New Booking",    path: "/clinic/search",   icon: Package   },
                { label: "Track Delivery", path: "/clinic/tracking", icon: Activity  },
                { label: "View Payments",  path: "/clinic/payment",  icon: CreditCard},
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-4 glass-panel rounded-2xl hover:bg-white transition-all text-sm font-black"
                >
                  <action.icon size={16} className="text-secondary" />
                  {action.label}
                  <ChevronRight size={14} className="ml-auto opacity-30" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}