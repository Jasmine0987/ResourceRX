import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Wrench, AlertCircle, CheckCircle2,
  Filter, ChevronRight, ArrowRight, History, ChevronLeft,
  Loader, X, Play
} from 'lucide-react';

const ORDERS_INIT = [
  { id:"SO-4402", type:"Emergency Repair",      asset:"MRI Magnetom #04",  location:"North General · Suite B",  time:"ASAP",    status:"Dispatched", priority:"CRITICAL",
    desc:"Liquid Helium at 92%. Immediate topping and seal inspection required to prevent quench." },
  { id:"SO-3918", type:"Preventative Maint.",   asset:"GE Revolution CT",  location:"Summit Radiology",         time:"14:30",   status:"Scheduled",  priority:"STANDARD",
    desc:"6-month preventative maintenance cycle. Includes tube cooling check and software update to v12.1." },
  { id:"SO-3801", type:"Software Calibration",  asset:"Mobile X-Ray B",    location:"Mercy Outpatient",         time:"16:00",   status:"Scheduled",  priority:"STANDARD",
    desc:"Post-transport recalibration after DEP-884. Verify grid alignment and exposure consistency." },
  { id:"SO-3750", type:"Sensor Replacement",    asset:"Dialysis System V4", location:"City General · Ward 3",   time:"Tomorrow",status:"Pending",     priority:"STANDARD",
    desc:"Pressure sensor P-004 showing drift of 0.8%. Replace and re-zero before next patient session." },
];

const PRIORITY_STYLE = {
  CRITICAL:"bg-red-500/10 text-red-600 border border-red-200",
  STANDARD:"bg-primary/10 text-primary/60",
};
const STATUS_STYLE = {
  Dispatched:"bg-secondary/10 text-secondary",
  Scheduled:"bg-primary/5 text-primary/60",
  Pending:"bg-amber-500/10 text-amber-600",
  Completed:"bg-emerald-500/10 text-emerald-600",
};

export default function TechServiceOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rrx_tech_orders');
      if (saved) return JSON.parse(saved);
      // First load — seed session so later complete() calls persist
      sessionStorage.setItem('rrx_tech_orders', JSON.stringify(ORDERS_INIT));
      return ORDERS_INIT;
    } catch { return ORDERS_INIT; }
  });
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [commencing, setCommencing] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const filterOpts = ['All','CRITICAL','Scheduled','Pending'];
  const filtered = orders.filter(o =>
    filter === 'All' ? true :
    filter === 'CRITICAL' ? o.priority === 'CRITICAL' :
    o.status === filter
  );

  const commence = (id) => {
    setCommencing(id);
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id===id ? {...o,status:'Dispatched'} : o));
      setCommencing(null);
      navigate('/tech/calibration');
    }, 1800);
  };

  const complete = (id) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id===id ? {...o,status:'Completed'} : o);
      sessionStorage.setItem('rrx_tech_orders', JSON.stringify(updated));
      return updated;
    });
    setSelected(null);
  };

  const active = orders.find(o => o.status==='Dispatched' && o.priority==='CRITICAL') || orders.find(o=>o.status==='Dispatched');
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase mb-3 text-primary border border-primary/20">
            <Calendar size={12} className="text-secondary"/> Daily Workload: {orders.length} Orders
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Service Orders</h2>
        </div>
        <div className="flex gap-3 relative">
          <button onClick={() => setShowFilter(f=>!f)}
            className="glass-panel px-8 py-4 rounded-3xl flex items-center gap-2 text-[10px] font-black uppercase hover:bg-white transition-all text-primary">
            <Filter size={16}/> {filter === 'All' ? 'Filter' : filter}
          </button>
          <AnimatePresence>
            {showFilter && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                className="absolute top-14 right-0 z-20 glass-panel p-4 rounded-2xl shadow-xl w-44 space-y-2">
                {filterOpts.map(f => (
                  <button key={f} onClick={() => {setFilter(f);setShowFilter(false);}}
                    className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all text-primary ${filter===f?'bg-primary text-white':'hover:bg-white/60'}`}>
                    {f}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button className="glass-panel px-8 py-4 rounded-3xl flex items-center gap-2 text-[10px] font-black uppercase hover:bg-white transition-all text-primary">
            <History size={16}/> Past 24h
          </button>
        </div>
      </div>

      {/* ACTIVE MISSION HERO */}
      {active && (
        <motion.div initial={{scale:0.97,opacity:0}} animate={{scale:1,opacity:1}}
          className={`${glass} bg-primary text-white border-none shadow-2xl shadow-primary/30`}>
          <div className="absolute top-0 right-0 p-8">
            <div className="flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full border border-secondary/30">
              <div className="w-2 h-2 rounded-full bg-secondary animate-ping"/>
              <span className="text-[10px] font-black uppercase">Active Mission</span>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-5">
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Critical Action Required</p>
              <h3 className="text-5xl font-black tracking-tighter italic uppercase">{active.type}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-white/60">
                  <MapPin size={18} className="text-secondary"/><span className="text-sm font-bold uppercase">{active.location}</span>
                </div>
                <div className="flex items-center gap-4 text-white/60">
                  <Wrench size={18} className="text-secondary"/><span className="text-sm font-bold uppercase">{active.asset}</span>
                </div>
                <div className="flex items-center gap-4 text-white/60">
                  <Clock size={18} className="text-secondary"/><span className="text-sm font-bold uppercase">{active.time}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-4">
              <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Issue Description</p>
                <p className="text-xs font-bold leading-relaxed">{active.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/tech/calibration')}
                  className="bg-secondary text-primary py-5 rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <Play size={16}/> Commence
                </button>
                <button onClick={() => complete(active.id)}
                  className="bg-white/10 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={16}/> Mark Done
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* QUEUE */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-primary ml-4">
          {filter === 'All' ? 'All Orders' : filter} — {filtered.length} shown
        </h4>
        <AnimatePresence>
          {filtered.map((order, i) => (
            <motion.div key={order.id}
              initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} transition={{delay:i*0.06}}
              onClick={() => setSelected(selected===order.id ? null : order.id)}
              className={`glass-panel rounded-[2.5rem] overflow-hidden border-white hover:border-secondary/30 transition-all cursor-pointer ${order.status==='Completed'?'opacity-50':''}`}>
              {/* ROW */}
              <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${order.priority==='CRITICAL'?'bg-red-500/10 text-red-500':'bg-primary/5 text-primary'}`}>
                    <Clock size={24}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase bg-primary/5 px-2 py-0.5 rounded-full text-primary">{order.id}</span>
                      <span className="text-[9px] font-black opacity-30 uppercase text-primary">{order.time}</span>
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight italic text-primary">{order.type}</h4>
                    <p className="text-xs font-bold opacity-40 uppercase text-primary">{order.asset} · {order.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${PRIORITY_STYLE[order.priority]}`}>{order.priority}</span>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                  <ChevronRight size={18} className={`text-primary transition-transform ${selected===order.id?'rotate-90':''} opacity-30`}/>
                </div>
              </div>
              {/* EXPANDED */}
              <AnimatePresence>
                {selected === order.id && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                    className="overflow-hidden border-t border-primary/5">
                    <div className="p-8 flex flex-col md:flex-row gap-8 justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase opacity-30 mb-2 text-primary">Issue Description</p>
                        <p className="text-sm font-bold text-primary">{order.desc}</p>
                      </div>
                      {order.status !== 'Completed' && (
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={e=>{e.stopPropagation();
                            sessionStorage.setItem('rrx_diag_asset', JSON.stringify({id:order.id,asset:order.asset,type:order.type,location:order.location,desc:order.desc}));
                            navigate('/tech/diagnostics', { state: { orderId: order.id, asset: order.asset } });}}
                            className="glass-panel px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-primary hover:bg-white/60 transition-all flex items-center gap-2">
                            Run Diagnostics
                          </button>
                          <button onClick={e=>{e.stopPropagation();commence(order.id);}} disabled={!!commencing}
                            className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all flex items-center gap-2 disabled:opacity-50">
                            {commencing===order.id?<Loader size={14} className="animate-spin"/>:<Play size={14}/>}
                            {commencing===order.id?'Starting…':'Commence Protocol'}
                          </button>
                          <button onClick={e=>{e.stopPropagation();complete(order.id);}}
                            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <CheckCircle2 size={14}/> Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ROUTE INSIGHT */}
      <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
          <CheckCircle2 size={24}/>
        </div>
        <div>
          <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Route Optimised</h5>
          <p className="text-xs font-bold opacity-50 uppercase text-primary">Completing SO-3918 today reduces tomorrow's travel time by 45 minutes.</p>
        </div>
        <button onClick={() => navigate('/tech/prep')}
          className="ml-auto text-[10px] font-black uppercase text-primary hover:text-secondary transition-colors">
          Plan Route →
        </button>
      </div>
    </div>
  );
}