import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, MapPin, CheckCircle2, Navigation, Clock, Zap,
  ChevronRight, Activity, Package, BookOpen, ShieldAlert,
  Bell, X, AlertTriangle, ChevronLeft
} from 'lucide-react';

const TASKS_INIT = [
  { id:1, time:"14:00", task:"Routine Cryogen Check",  unit:"Siemens MRI #04",  status:"Upcoming",  route:"/tech/service-orders" },
  { id:2, time:"16:30", task:"Safety Protocol 09",     unit:"Mobile X-Ray B",   status:"Upcoming",  route:"/tech/calibration"    },
  { id:3, time:"Done",  task:"Software Patch v4.2",    unit:"CT-Omega",         status:"Completed", route:"/tech/service-orders" },
  { id:4, time:"11:00", task:"Diagnostic Sweep",       unit:"GE Revolution CT", status:"Completed", route:"/tech/diagnostics"    },
];

export default function TechDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks]   = useState(TASKS_INIT);
  const [alerts, setAlerts] = useState([
    { id:1, msg:"Emergency calibration request: St. Luke's", urgent:true,  route:"/tech/service-orders" },
    { id:2, msg:"Low stock: High-Voltage Cable Set",         urgent:false, route:"/tech/inventory"      },
  ]);

  // simulate new alert every 25s
  useEffect(() => {
    const pool = [
      { msg:"New service order assigned: Summit CT",    urgent:true,  route:"/tech/service-orders" },
      { msg:"Part shipment arrived at your next site",  urgent:false, route:"/tech/inventory"      },
    ];
    let i = 0;
    const t = setInterval(() => {
      setAlerts(prev => [{ id: Date.now(), ...pool[i % pool.length] }, ...prev.slice(0,4)]);
      i++;
    }, 25000);
    return () => clearInterval(t);
  }, []);

  const markDone  = (id) => setTasks(prev => prev.map(t => t.id===id ? {...t, status:'Completed', time:'Done'} : t));
  const dismiss   = (id) => setAlerts(prev => prev.filter(a => a.id!==id));
  const completed = tasks.filter(t => t.status==='Completed').length;

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";
  const quickNav = [
    { label:"Service Orders", icon:Wrench,    route:"/tech/service-orders", color:"bg-primary text-white"     },
    { label:"Diagnostics",    icon:Activity,  route:"/tech/diagnostics",    color:"bg-secondary text-primary" },
    { label:"Inventory",      icon:Package,   route:"/tech/inventory",      color:"bg-white/60 text-primary"  },
    { label:"Library",        icon:BookOpen,  route:"/tech/library",        color:"bg-white/60 text-primary"  },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-6 pb-20">

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/10 text-[10px] font-black uppercase mb-4 text-secondary">
            <Zap size={14}/> Field Status: Active
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Ops Center</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] text-primary">Tech ID</p>
          <p className="text-sm font-bold tracking-widest text-primary">RRX-TECH-404</p>
        </div>
      </div>

      {/* LIVE ALERTS */}
      <AnimatePresence>
        {alerts.map(a => (
          <motion.div key={a.id}
            initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,x:20}}
            onClick={() => navigate(a.route)}
            className={`flex items-center justify-between px-8 py-5 rounded-2xl cursor-pointer border ${a.urgent?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <Bell size={16} className={a.urgent?'text-red-500':'text-amber-500'}/>
              <p className="text-xs font-bold uppercase tracking-tight text-primary">{a.msg}</p>
            </div>
            <div className="flex items-center gap-3">
              <ChevronRight size={14} className="text-primary opacity-40"/>
              <button onClick={e=>{e.stopPropagation();dismiss(a.id);}} className="text-primary opacity-30 hover:opacity-100 transition-opacity"><X size={14}/></button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* QUICK NAV */}
      <div className="grid grid-cols-4 gap-4">
        {quickNav.map((n,i) => (
          <button key={i} onClick={() => navigate(n.route)}
            className={`${n.color} glass-panel p-5 rounded-[2rem] flex items-center justify-between font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all`}>
            <span>{n.label}</span><n.icon size={16}/>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ACTIVE MISSION */}
        <div className="lg:col-span-2">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className={`${glass} bg-primary text-white border-none`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Priority 01 · Next Mission</p>
                <h3 className="text-4xl font-black tracking-tighter italic uppercase">Emergency Calibration</h3>
              </div>
              <div className="bg-white/10 p-4 rounded-3xl"><Navigation className="text-secondary animate-pulse"/></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  { icon:MapPin, label:"Location", val:"St. Luke's Oncology Wing" },
                  { icon:Wrench, label:"Asset",    val:"GE Revolution CT #102"   },
                  { icon:Clock,  label:"ETA",      val:"Dispatch: ASAP"          },
                ].map((row,i) => (
                  <div key={i} className="flex items-center gap-4">
                    <row.icon className="text-secondary" size={18}/>
                    <div>
                      <p className="text-[10px] font-black opacity-40 uppercase">{row.label}</p>
                      <p className="text-sm font-bold uppercase">{row.val}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 justify-end">
                <button onClick={() => navigate('/tech/service-orders')}
                  className="bg-secondary text-primary w-full py-5 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-secondary/20">
                  Initiate Navigation →
                </button>
                <button onClick={() => navigate('/tech/calibration')}
                  className="bg-white/10 text-white w-full py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">
                  Start Calibration Protocol
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SHIFT STATS */}
        <div className={glass}>
          <h3 className="text-xl font-black mb-6 italic uppercase text-primary">Shift Stats</h3>
          <div className="space-y-5 mb-8">
            {[
              { label:"Tasks Completed",    val:`${completed} / ${tasks.length}` },
              { label:"Uptime Contribution",val:"99.2%"   },
              { label:"Avg. Service Time",  val:"1.2 Hrs" },
            ].map((s,i) => (
              <div key={i} className="pb-4 border-b border-primary/5 last:border-0">
                <p className="text-[10px] font-black opacity-30 uppercase text-primary">{s.label}</p>
                <p className="text-2xl font-black text-primary">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <button onClick={() => navigate('/tech/incidents')}
              className="w-full py-4 bg-red-50 border border-red-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
              <ShieldAlert size={14}/> File Incident
            </button>
            <button onClick={() => navigate('/tech/prep')}
              className="w-full py-4 glass-panel rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-white/60 transition-all">
              Deployment Prep →
            </button>
          </div>
        </div>
      </div>

      {/* MISSION QUEUE */}
      <div className={glass}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary">Mission Queue</h3>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary flex items-center gap-2">
            <Clock size={14}/> {completed}/{tasks.length} Complete
          </p>
        </div>
        <div className="space-y-3">
          {tasks.map((task,i) => (
            <motion.div key={task.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
              onClick={() => task.status!=='Completed' && navigate(task.route)}
              className={`p-7 rounded-[2rem] border flex justify-between items-center transition-all ${task.status==='Completed'?'bg-emerald-500/5 border-emerald-500/20 opacity-50':'bg-white/40 border-white hover:bg-white cursor-pointer'}`}>
              <div className="flex items-center gap-6">
                <p className="text-xs font-black uppercase text-secondary w-12">{task.time}</p>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-primary">{task.task}</p>
                  <p className="text-[10px] font-bold opacity-30 uppercase text-primary">{task.unit}</p>
                </div>
              </div>
              {task.status==='Completed'
                ? <CheckCircle2 className="text-emerald-500" size={20}/>
                : (
                  <div className="flex items-center gap-3">
                    <button onClick={e=>{e.stopPropagation();markDone(task.id);}}
                      className="text-[9px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all">
                      Mark Done
                    </button>
                    <ChevronRight size={16} className="text-primary opacity-30"/>
                  </div>
                )
              }
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}