import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Activity, DollarSign, AlertCircle, ArrowUpRight,
  ChevronRight, Zap, Bell, X, Package, Truck
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

const ALERTS_INIT = [
  { id: 1, type: 'Booking',     msg: 'New MRI Request: Mercy Clinic',      time: '2m ago',  route: '/owner/requests',    urgent: true  },
  { id: 2, type: 'Maintenance', msg: 'CT Scanner #04 Sensor Alert',         time: '14m ago', route: '/owner/analytics',   urgent: true  },
  { id: 3, type: 'Finance',     msg: 'Settlement $12,400 Processed',        time: '1h ago',  route: '/owner/settlements', urgent: false },
  { id: 4, type: 'Dispatch',    msg: 'Siemens MRI delivered to Summit NJ',  time: '2h ago',  route: '/owner/dispatch',    urgent: false },
];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { ownerAssets } = useClinic();
  const [alerts, setAlerts]   = useState(ALERTS_INIT);
  const [revenue, setRevenue] = useState(128400);

  useEffect(() => {
    const newAlerts = [
      { type: 'Booking', msg: 'New CT Request: Johns Hopkins',  route: '/owner/requests',  urgent: true  },
      { type: 'Finance', msg: 'Yield Report Ready for Review',  route: '/owner/yield',     urgent: false },
      { type: 'Vault',   msg: 'ISO Certificate expiring soon',  route: '/owner/vault',     urgent: true  },
    ];
    let idx = 0;
    const t = setInterval(() => {
      const a = newAlerts[idx % newAlerts.length];
      setAlerts(prev => [{ id: Date.now(), time: 'Just now', ...a }, ...prev.slice(0, 5)]);
      setRevenue(r => r + Math.round(Math.random() * 500));
      idx++;
    }, 20000);
    return () => clearInterval(t);
  }, []);

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const glassStyle = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  const stats = [
    { label: "Fleet Valuation",  value: "$4.2M",   sub: "12 Active Assets",  icon: Zap,       color: "text-secondary",   route: "/owner/vault"       },
    { label: "Monthly Revenue",  value: `$${(revenue/1000).toFixed(1)}k`, sub: "+14.2% Growth", icon: DollarSign, color: "text-emerald-500", route: "/owner/settlements" },
    { label: "Avg. Utilization", value: "92%",     sub: "Critical Demand",   icon: Activity,  color: "text-primary",     route: "/owner/analytics"   },
  ];

  const quickNav = [
    { label: "Add Equipment", icon: Package,    route: "/owner/add",      color: "bg-primary text-white"     },
    { label: "Requests",      icon: Bell,       route: "/owner/requests", color: "bg-secondary text-primary" },
    { label: "Dispatch",      icon: Truck,      route: "/owner/dispatch", color: "bg-white/60 text-primary"  },
    { label: "Yield Config",  icon: TrendingUp, route: "/owner/yield",    color: "bg-white/60 text-primary"  },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4 text-primary">
            <Activity size={14} className="text-secondary" /> System Status: 100% Operational
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic text-primary">Control Center</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] text-primary">Owner ID</p>
          <p className="text-sm font-bold tracking-widest text-primary">RRX-OWN-88102</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickNav.map((n, i) => (
          <button key={i} onClick={() => navigate(n.route)}
            className={`${n.color} glass-panel p-5 rounded-[2rem] flex items-center justify-between font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all`}>
            <span>{n.label}</span><n.icon size={16} />
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            onClick={() => navigate(stat.route)}
            className={`${glassStyle} cursor-pointer hover:scale-[1.02] group`}>
            <stat.icon className={`${stat.color} mb-8 group-hover:scale-110 transition-transform`} size={32} />
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 text-primary">{stat.label}</p>
            <h3 className="text-4xl font-black tracking-tighter mb-2 text-primary">{stat.value}</h3>
            <p className="text-[11px] font-bold text-primary/60">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 ${glassStyle} min-h-[380px] flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary">Fleet Pulse</h3>
              <p className="text-xs font-bold opacity-40 uppercase text-primary">Real-time asset distribution</p>
            </div>
            <button onClick={() => navigate('/owner/dispatch')}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-secondary hover:text-primary transition-all">
              Live Dispatch <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex-1 my-6 bg-primary/5 rounded-[2.5rem] border border-white/50 relative overflow-hidden min-h-[160px]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1d3557_2px,transparent_2px)] [background-size:30px_30px]" />
            {[{x:'30%',y:'45%',d:0},{x:'60%',y:'25%',d:.3},{x:'75%',y:'60%',d:.6},{x:'20%',y:'70%',d:.9}].map((p, i) => (
              <motion.div key={i} className="absolute" style={{ left: p.x, top: p.y }}
                animate={{ scale: [1,1.4,1], opacity: [0.7,0.3,0.7] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: p.d }}>
                <div className="w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-lg" />
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {(ownerAssets || []).slice(0,8).map((a, i) => {
              const pct = a.status === 'Deployed' ? 100 : a.status === 'Available' ? 45 : 20;
              return (
              <div key={i} onClick={() => navigate('/owner/analytics')} className="cursor-pointer group">
                <div className="flex justify-between text-[9px] font-black mb-1.5 text-primary opacity-60">
                  <span className="truncate">{a.name?.split(' ').slice(0,2).join(' ') || a.type}</span>
                  <span className={`${a.status==='Deployed'?'text-emerald-600':a.status==='Available'?'text-secondary':'text-amber-500'}`}>{a.status}</span>
                </div>
                <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, delay: 0.5+i*0.1 }}
                    className="h-full bg-primary rounded-full group-hover:bg-secondary transition-colors" />
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className={glassStyle}>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-primary">
            <AlertCircle className="text-red-500" size={20} /> Notifications
            {alerts.filter(a=>a.urgent).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{alerts.filter(a=>a.urgent).length}</span>
            )}
          </h3>
          <AnimatePresence>
            <div className="space-y-3">
              {alerts.map(alert => (
                <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onClick={() => navigate(alert.route)}
                  className={`p-5 rounded-2xl border cursor-pointer hover:bg-white/60 transition-all group relative ${alert.urgent?'bg-red-50/50 border-red-100':'bg-white/40 border-white'}`}>
                  <button onClick={e=>{e.stopPropagation();dismiss(alert.id);}}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity text-primary"><X size={12}/></button>
                  <p className="text-[9px] font-black opacity-30 uppercase mb-1 text-primary">{alert.time} · {alert.type}</p>
                  <div className="flex justify-between items-center pr-4">
                    <p className="text-xs font-bold uppercase tracking-tight text-primary">{alert.msg}</p>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          <button onClick={() => navigate('/owner/requests')}
            className="mt-6 w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all">
            View All Requests →
          </button>
        </div>
      </div>
    </div>
  );
}