import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Zap, Globe, Users, ArrowUpRight, Activity,
  ShieldCheck, Clock, BarChart3, MapPin, AlertTriangle,
  Package, Radio, ChevronRight, Navigation
} from 'lucide-react';

// ── Live feed data (simulates incoming dispatch events) ──────────────────────
const FEED_INIT = [
  { id: 1, time: "Just now",  event: "RRX-882 Arrived",        loc: "Summit Health NJ",  type: "arrival" },
  { id: 2, time: "14m ago",   event: "Pickup Confirmed",        loc: "Northwell NY",       type: "pickup"  },
  { id: 3, time: "28m ago",   event: "Route Recalculated",      loc: "I-95 North",         type: "alert"   },
  { id: 4, time: "1h ago",    event: "New Assignment Issued",   loc: "Boston Med Center",  type: "new"     },
  { id: 5, time: "2h ago",    event: "Incident Reported",       loc: "NJ Turnpike",        type: "incident"},
];

const TYPE_COLORS = {
  arrival:  "bg-emerald-500",
  pickup:   "bg-secondary",
  alert:    "bg-amber-500",
  new:      "bg-primary",
  incident: "bg-red-500",
};

export default function LogisticsDashboard() {
  const navigate = useNavigate();
  const [feed, setFeed]         = useState(FEED_INIT);
  const [activeUnits, setActiveUnits] = useState(8);
  const [ping, setPing]         = useState(false);

  // Simulate new events every 12 seconds
  useEffect(() => {
    const events = [
      { event: "Cargo Secured",         loc: "Hartford CT",     type: "pickup"  },
      { event: "Temperature Alert",     loc: "RX-441 Unit",     type: "alert"   },
      { event: "Delivery Confirmed",    loc: "Mercy Hospital",  type: "arrival" },
      { event: "New Dispatch Request",  loc: "Admin Portal",    type: "new"     },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setPing(true);
      setTimeout(() => setPing(false), 800);
      const next = events[idx % events.length];
      setFeed(prev => [{
        id: Date.now(), time: "Just now", ...next
      }, ...prev.slice(0, 6)]);
      idx++;
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Active Fleet",   value: "24",   sub: `${activeUnits} in Transit`,  icon: Truck,      color: "text-primary",      route: "/logistics/map"     },
    { label: "Avg. Transit",   value: "42m",  sub: "-12% vs last week",           icon: Zap,        color: "text-secondary",    route: "/logistics/active"  },
    { label: "System Health",  value: "98.2%",sub: "All Nodes Optimal",           icon: ShieldCheck,color: "text-emerald-500",  route: "/logistics/map"     },
    { label: "Active Techs",   value: "18",   sub: "4 On Standby",                icon: Users,      color: "text-primary",      route: "/logistics/active"  },
  ];

  const quickActions = [
    { label: "Live Map",        icon: MapPin,       route: "/logistics/map",      color: "bg-primary text-white"     },
    { label: "Active Dispatch", icon: Truck,         route: "/logistics/active",   color: "bg-secondary text-primary" },
    { label: "Incident Log",    icon: AlertTriangle, route: "/logistics/incident", color: "bg-red-100 text-red-600"   },
    { label: "Handover Logs",   icon: Package,       route: "/logistics/logs",     color: "bg-white/60 text-primary"  },
  ];

  return (
    <div className="pt-20 pb-20 px-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4">
            <BarChart3 size={14} className="text-secondary" />
            Operational Intelligence
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-primary">Fleet Command</h2>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full bg-emerald-500 ${ping ? 'scale-150' : ''} transition-transform`} />
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">All Systems Operational</p>
        </div>
      </div>

      {/* STATS — each card navigates */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(stat.route)}
            className="glass-panel p-8 rounded-[2.5rem] h-48 flex flex-col justify-between hover:scale-[1.03] transition-all cursor-pointer group"
          >
            <stat.icon className={`${stat.color} group-hover:scale-110 transition-transform`} size={24} />
            <div>
              <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-4xl font-black tracking-tighter text-primary">{stat.value}</p>
              <p className="text-[10px] font-bold opacity-60 mt-1 uppercase">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {quickActions.map((a, i) => (
          <button
            key={i}
            onClick={() => navigate(a.route)}
            className={`${a.color} glass-panel p-5 rounded-[2rem] flex items-center justify-between font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all`}
          >
            <span>{a.label}</span>
            <a.icon size={18} />
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* NETWORK CARD */}
        <div className="lg:col-span-2 glass-panel p-10 rounded-[3.5rem] relative overflow-hidden bg-primary text-white border-none shadow-2xl shadow-primary/20 min-h-[320px] flex flex-col justify-between">
          <div className="relative z-10">
            <h3 className="text-3xl font-black tracking-tighter mb-3 italic text-secondary">Satellite Mesh Network</h3>
            <p className="text-sm font-bold opacity-60 max-w-sm leading-relaxed">
              Real-time positioning active for all Class-7 medical transport vehicles. 14 nodes reporting across the Eastern Seaboard.
            </p>
          </div>
          <div className="relative z-10 flex gap-4 mt-8">
            <button
              onClick={() => navigate('/logistics/map')}
              className="bg-white text-primary px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-secondary hover:text-white transition-all"
            >
              Open Live Map <ArrowUpRight size={16} />
            </button>
            <button
              onClick={() => navigate('/logistics/active')}
              className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Active Dispatch
            </button>
          </div>
          <Globe className="absolute -right-20 -bottom-20 opacity-10 text-white" size={450} />
        </div>

        {/* LIVE DISPATCH FEED */}
        <div className="glass-panel p-10 rounded-[3.5rem] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-primary">
              <Radio size={18} className={`text-secondary ${ping ? 'animate-ping' : ''}`} /> Dispatch Feed
            </h3>
            <button
              onClick={() => navigate('/logistics/logs')}
              className="text-[9px] font-black uppercase opacity-40 hover:opacity-100 flex items-center gap-1 transition-opacity text-primary"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          <AnimatePresence>
            <div className="space-y-4">
              {feed.slice(0, 5).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4 items-start pb-4 border-b border-primary/5 last:border-0"
                >
                  <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[item.type]} mt-1.5 shrink-0`} />
                  <div>
                    <p className="text-[10px] font-black opacity-30 uppercase text-primary">{item.time} · {item.loc}</p>
                    <p className="text-xs font-bold uppercase tracking-tight text-primary">{item.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Incident shortcut */}
          <button
            onClick={() => navigate('/logistics/incident')}
            className="mt-6 w-full py-4 bg-red-50 border border-red-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle size={14} /> File Incident Report
          </button>
        </div>
      </div>

      {/* ASSET DISTRIBUTION */}
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <div className="glass-panel p-10 rounded-[3.5rem] relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black tracking-tighter uppercase italic text-primary">Asset Distribution</h3>
            <Activity className="text-secondary" />
          </div>
          {[
            { label: "MRI Units",       pct: 85 },
            { label: "CT Scanners",     pct: 70 },
            { label: "Dialysis Kits",   pct: 55 },
            { label: "Ventilators",     pct: 40 },
          ].map((item, i) => (
            <div key={i} className="mb-5">
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase opacity-60 text-primary">
                <span>{item.label}</span><span>{item.pct}% Capacity</span>
              </div>
              <div className="h-2 bg-primary/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => navigate('/logistics/active')}
          className="glass-panel p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center cursor-pointer group hover:scale-[1.02] transition-all"
        >
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
            <Navigation size={32} />
          </div>
          <h4 className="text-2xl font-black tracking-tighter uppercase text-primary">Manage Active Dispatch</h4>
          <p className="text-xs font-bold opacity-40 mt-2 max-w-[200px] uppercase text-primary">View assignments, routes, and delivery handover in real time.</p>
          <div className="mt-6 flex items-center gap-2 text-secondary font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
            Open Dispatch <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}