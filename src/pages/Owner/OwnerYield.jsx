import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Zap, Target, LineChart, ShieldCheck, ArrowUpRight, Flame, Globe, Settings, ChevronLeft, CheckCircle2, Loader, BrainCircuit } from 'lucide-react';

const DEMAND_DATA = [
  { region:"Northeast Corridor", demand:"High",     yield:"+22%", trend:80, detail:"8 hospitals in queue, avg wait 4.2 days" },
  { region:"West Coast / LA",    demand:"Critical", yield:"+41%", trend:97, detail:"MRI shortage — 3 facilities on emergency waitlist" },
  { region:"Midwest Rural",      demand:"Stable",   yield:"+5%",  trend:35, detail:"Steady demand, no immediate shortages" },
  { region:"Southeast / FL",     demand:"Growing",  yield:"+18%", trend:65, detail:"Seasonal uptick — Jan–Mar peak period" },
];

const AI_PARAMS = [
  { label:"Floor Price (Daily)", val:"$2,100",  enabled:true,  key:"floor",    ai_reason:"↑ from $1,850 — LA scarcity signal detected" },
  { label:"Utilization Ceiling", val:"92%",     enabled:true,  key:"util",     ai_reason:"↓ from 95% — protect maintenance schedule" },
  { label:"Minimum Duration",    val:"14 Days", enabled:true,  key:"duration", ai_reason:"↑ from 7 — reduces logistics cost $420/deployment" },
  { label:"Emergency Markup",    val:"+65%",    enabled:true,  key:"markup",   ai_reason:"↑ from +50% — P1 emergency demand active in FL" },
];

const MANUAL_PARAMS = [
  { label:"Floor Price (Daily)", val:"$1,850", enabled:true,  key:"floor"    },
  { label:"Utilization Ceiling", val:"95%",    enabled:true,  key:"util"     },
  { label:"Minimum Duration",    val:"7 Days", enabled:false, key:"duration" },
  { label:"Emergency Markup",    val:"+50%",   enabled:true,  key:"markup"   },
];

export default function OwnerYield() {
  const navigate = useNavigate();
  const [mode,       setMode]     = useState('AI-Optimized');
  const [multiplier, setMult]     = useState(1.45);
  const [params,     setParams]   = useState(AI_PARAMS);
  const [applied,    setApplied]  = useState(false);
  const [applyLog,   setApplyLog] = useState([]);
  const [relocating, setReloc]    = useState(false);

  // Switch params when mode changes
  useEffect(() => {
    setParams(mode === 'AI-Optimized' ? AI_PARAMS : MANUAL_PARAMS);
  }, [mode]);

  const toggleParam = (key) => setParams(prev => prev.map(p => p.key===key ? {...p,enabled:!p.enabled} : p));

  const applyStrategy = () => {
    setApplied(true);
    const activeParams = params.filter(p=>p.enabled).map(p=>p.label);
    const entry = {
      time: new Date().toLocaleTimeString(),
      mode,
      multiplier: multiplier.toFixed(2),
      params: activeParams,
      projection: `$${Math.round(multiplier*98500*0.92/1000)}k/month`,
    };
    setApplyLog(prev => [entry, ...prev.slice(0,4)]);
    // Apply AI-optimized values to params
    setParams(prev => prev.map(p => ({...p, val: AI_PARAMS.find(a=>a.key===p.key)?.val || p.val})));
    try {
      sessionStorage.setItem('rrx_yield_strategy', JSON.stringify(entry));
    } catch {}
    setTimeout(() => setApplied(false), 3000);
  };

  const applyRelocation = () => {
    setReloc(true);
    setTimeout(() => { setReloc(false); navigate('/owner/dispatch'); }, 1500);
  };

  const projectedYield = Math.round(multiplier * 98500);
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <button onClick={()=>navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Control Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/10 text-[10px] font-black uppercase mb-3 text-secondary border border-secondary/20">
            <Flame size={12}/> Dynamic Market Pulse Active
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Yield Strategy</h2>
        </div>
        <div className="bg-white/40 p-2 rounded-3xl flex gap-1">
          {['Manual','AI-Optimized'].map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${m===mode?'bg-primary text-white shadow-lg':'opacity-40 hover:opacity-100 text-primary'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* SURGE CONTROL */}
        <div className={`${glass} bg-gradient-to-br from-white/40 to-secondary/5`}>
          <div className="flex justify-between items-start mb-8">
            <div className="p-4 bg-white rounded-2xl text-secondary shadow-sm"><Zap size={24} fill="currentColor"/></div>
            <div className="text-right">
              <p className="text-[10px] font-black opacity-30 uppercase text-primary">Multiplier</p>
              <h3 className="text-4xl font-black tracking-tighter text-primary">{multiplier.toFixed(2)}<span className="text-lg text-secondary">x</span></h3>
            </div>
          </div>
          <h4 className="text-xl font-black uppercase tracking-tighter italic mb-3 text-primary">Surge Protocol</h4>
          <p className="text-xs font-bold opacity-50 uppercase leading-relaxed mb-6 text-primary">Auto-raise rates when regional capacity drops below 15%.</p>

          <div className="relative h-3 bg-primary/5 rounded-full mb-4 cursor-pointer"
            onClick={e=>{
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
              setMult(+(1+pct*1.5).toFixed(2));
            }}>
            <div className="absolute left-0 top-0 h-full bg-secondary rounded-full transition-all" style={{width:`${((multiplier-1)/1.5)*100}%`}}/>
            <div className="absolute -top-1.5 w-6 h-6 bg-white border-4 border-secondary rounded-full shadow-xl cursor-grab" style={{left:`calc(${((multiplier-1)/1.5)*100}% - 12px)`}}/>
          </div>
          <div className="flex justify-between text-[10px] font-black opacity-30 uppercase text-primary mb-6">
            <span>1.0x Conservative</span><span>2.5x Max</span>
          </div>
          <div className="p-5 bg-primary/5 rounded-2xl text-center">
            <p className="text-[9px] font-black uppercase opacity-40 text-primary mb-1">Projected Monthly @ {multiplier.toFixed(2)}x</p>
            <p className="text-2xl font-black text-primary">${projectedYield.toLocaleString()}</p>
          </div>
        </div>

        {/* DEMAND HEATMAP */}
        <div className={glass}>
          <div className="flex justify-between items-start mb-6">
            <h4 className="text-xl font-black uppercase tracking-tighter italic text-primary">Demand Heatmap</h4>
            <Globe size={20} className="opacity-20 text-primary"/>
          </div>
          <div className="space-y-4">
            {DEMAND_DATA.map((item,i)=>(
              <div key={i} className="p-5 bg-white/40 rounded-[2rem] border border-white hover:bg-white transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-30 tracking-widest text-primary">{item.region}</p>
                    <p className="text-xs font-bold uppercase text-primary">{item.demand} Demand</p>
                    <p className="text-[9px] font-bold opacity-40 text-primary mt-1 italic">{item.detail}</p>
                  </div>
                  <div className="text-emerald-500 font-black text-sm flex items-center gap-1 shrink-0">
                    <ArrowUpRight size={14}/> {item.yield}
                  </div>
                </div>
                <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden mt-2">
                  <motion.div initial={{width:0}} animate={{width:`${item.trend}%`}} transition={{duration:1,delay:i*0.1}}
                    className={`h-full rounded-full ${item.trend>80?'bg-red-400':item.trend>60?'bg-amber-400':'bg-emerald-400'}`}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 30D PROJECTION + APPLY */}
        <div className={`${glass} border-primary/20`}>
          <div className="flex justify-between items-start mb-6">
            <h4 className="text-xl font-black uppercase tracking-tighter italic text-primary">30D Projection</h4>
            <LineChart size={20} className="text-primary opacity-40"/>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-5xl font-black tracking-tighter text-primary">${Math.round(projectedYield*0.92/1000)}k</h3>
            <span className="text-xs font-black text-emerald-500">+{Math.round((multiplier-1)*12)}%</span>
          </div>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-6 text-primary">Estimated Net Payout</p>

          {mode === 'AI-Optimized' && (
            <div className="p-5 bg-secondary/10 rounded-[2rem] border border-secondary/20 mb-6 flex items-start gap-3">
              <BrainCircuit size={16} className="text-secondary shrink-0 mt-1"/>
              <div>
                <p className="text-[9px] font-black uppercase text-secondary mb-1">AI Optimisation Active</p>
                <p className="text-[10px] font-bold text-primary opacity-70">Parameters adjusted for current market signals. Estimated revenue increase: +{Math.round((multiplier-1.0)*15)}% vs manual baseline.</p>
              </div>
            </div>
          )}

          <div className="p-5 bg-primary rounded-[2rem] text-white mb-5">
            <div className="flex items-center gap-3 mb-2"><Target size={14} className="text-secondary"/><span className="text-[9px] font-black uppercase">Optimisation Goal</span></div>
            <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase italic">Prioritize long-term rentals (30+ days) — minimises logistics overhead, maximises net margin.</p>
          </div>

          <button onClick={applyStrategy}
            className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${applied?'bg-emerald-500 text-white':'bg-primary text-white hover:bg-secondary hover:text-primary'}`}>
            {applied?<><CheckCircle2 size={16}/> Strategy Applied & Logged!</>:<>Apply Strategy →</>}
          </button>

          {/* Applied log */}
          <AnimatePresence>
            {applyLog.length > 0 && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="mt-4 overflow-hidden">
                <p className="text-[9px] font-black uppercase opacity-30 text-primary mb-2">Applied at {applyLog[0].time}</p>
                <p className="text-[10px] font-bold text-primary opacity-60">{applyLog[0].mode} · {applyLog[0].multiplier}x · {applyLog[0].projection}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* STRATEGY PARAMETERS */}
      <div className={glass}>
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <Settings className="text-secondary"/>
          <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary">Strategy Parameters</h3>
          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${mode==='AI-Optimized'?'bg-secondary/10 text-secondary':'bg-primary/10 text-primary/60'}`}>
            {mode} Mode
          </span>
          {mode==='AI-Optimized' && (
            <span className="ml-auto text-[9px] font-black uppercase opacity-40 text-primary flex items-center gap-1">
              <BrainCircuit size={10}/> Values set by MedGemma market analysis
            </span>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {params.map((param,i)=>(
            <div key={`${mode}-${i}`}
              onClick={()=>mode==='Manual'&&toggleParam(param.key)}
              className={`p-8 rounded-[2.5rem] border transition-all ${mode==='Manual'?'cursor-pointer hover:bg-white/60':''} ${param.enabled?'bg-white/40 border-white':'bg-primary/5 border-primary/10 opacity-50'}`}>
              <p className="text-[10px] font-black opacity-30 uppercase mb-3 tracking-widest text-primary">{param.label}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xl font-black tracking-tighter text-primary">{param.val}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${param.enabled?'bg-secondary':'bg-primary/10'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${param.enabled?'right-1':'left-1'}`}/>
                </div>
              </div>
              {mode==='AI-Optimized' && param.ai_reason && (
                <p className="text-[8px] font-bold opacity-40 text-primary italic">{param.ai_reason}</p>
              )}
            </div>
          ))}
        </div>
        {mode==='Manual' && (
          <p className="mt-4 text-[9px] font-bold opacity-30 uppercase text-primary">Click any parameter to toggle it on/off</p>
        )}
      </div>

      {/* MARKET ALERT */}
      <div className="p-10 rounded-[3.5rem] bg-secondary text-primary flex flex-col md:flex-row items-center gap-10">
        <div className="shrink-0 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
          <TrendingUp size={40}/>
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-2xl font-black italic uppercase tracking-tighter">Market Liquidity Alert</h4>
          <p className="text-sm font-bold opacity-70 leading-relaxed uppercase">
            A shortage of High-Field MRI units is projected for Florida starting next month. Relocating Unit #08 to the Miami node could capture a 25% premium — approx. <span className="font-black underline">+$18,400/month</span>.
          </p>
        </div>
        <button onClick={applyRelocation} disabled={relocating}
          className="bg-primary text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap shadow-xl disabled:opacity-60 flex items-center gap-2">
          {relocating?<><Loader size={14} className="animate-spin"/> Applying…</>:'Apply Relocation →'}
        </button>
      </div>

      {/* APPLIED LOG */}
      <AnimatePresence>
        {applyLog.length > 0 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={glass}>
            <h3 className="text-xl font-black italic uppercase mb-6 text-primary">Strategy Application Log</h3>
            <div className="space-y-3">
              {applyLog.map((entry,i)=>(
                <div key={i} className="flex items-center justify-between p-5 bg-white/40 rounded-2xl border border-white">
                  <div>
                    <p className="text-[9px] font-black opacity-30 uppercase text-primary">{entry.time} · {entry.mode}</p>
                    <p className="font-black text-sm text-primary">Multiplier {entry.multiplier}x · {entry.projection}</p>
                    <p className="text-[9px] font-bold opacity-40 text-primary">{entry.params.join(' · ')}</p>
                  </div>
                  <CheckCircle2 className="text-emerald-500" size={18}/>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}