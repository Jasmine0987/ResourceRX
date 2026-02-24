import { useClinic } from '../../context/ClinicContext';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Sparkles, Truck, PackageCheck, Lock,
  Camera, Zap, ShieldCheck, CheckCircle2, AlertCircle,
  ChevronLeft, Loader, X, Upload, MapPin, Clock
} from 'lucide-react';

const PROTOCOLS = [
  { id:1, task:"Sterilization Protocol",   desc:"Surface sanitization with medical-grade isopropyl. All contact surfaces must pass UV wand test.", icon:Sparkles,    required:true  },
  { id:2, task:"Mechanical Locking",        desc:"Secure gantry and table for high-G transit. Verify torque on 4 anchor bolts (spec: 40Nm).",       icon:Lock,        required:true  },
  { id:3, task:"Auxiliary Inventory",       desc:"Verify coils, phantoms, and patient pads loaded. Qty per manifest: Coil x2, Phantom x1, Pad x3.", icon:PackageCheck,required:true  },
  { id:4, task:"Visual Inspection",         desc:"Capture 360° departure images for insurance log. Min 8 photos: all 4 sides, top, underside.",      icon:Camera,      required:true  },
  { id:5, task:"Sensor Pre-check",          desc:"Boot asset and verify all sensor readings are nominal before powering down for transport.",         icon:Zap,         required:false },
  { id:6, task:"Documentation Package",     desc:"Confirm delivery manifest, chain-of-custody form, and compliance certs are in the transit bag.",   icon:ClipboardCheck, required:false },
];

export default function TechPrep() {
  const navigate = useNavigate();
  const fileRef  = useRef();
  const [checked,    setChecked]   = useState([]);
  const [photos,     setPhotos]    = useState([]);
  const [notes,      setNotes]     = useState('');
  const [releasing,  setReleasing] = useState(false);
  const [released,   setReleased]  = useState(false);

  const toggle = (id) => setChecked(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev,id]);

  const required = PROTOCOLS.filter(p=>p.required);
  const requiredDone = required.every(p => checked.includes(p.id));
  const allDone = PROTOCOLS.every(p => checked.includes(p.id));
  const pct = Math.round((checked.length / PROTOCOLS.length) * 100);

  const doRelease = () => {
    setReleasing(true);
    setTimeout(() => {
      // Mark deployment prep task complete in ops center
      try {
        // Mark deployment prep in ops center task feed
        const tasks = JSON.parse(sessionStorage.getItem('rrx_tech_tasks') || '[]');
        tasks.unshift({ id:`PREP-${Date.now()}`, task:'Deployment Prep Complete — Released to Carrier', unit:'GE Revolution CT', status:'Completed', completedAt: new Date().toLocaleString() });
        sessionStorage.setItem('rrx_tech_tasks', JSON.stringify(tasks));
        // Mark Scheduled → Dispatched in service orders
        const ordersRaw = sessionStorage.getItem('rrx_tech_orders');
        const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
        const updatedOrders = orders.map(o => o.status === 'Scheduled' ? {...o, status:'Dispatched', desc: o.desc + ' [Released to carrier]'} : o);
        sessionStorage.setItem('rrx_tech_orders', JSON.stringify(updatedOrders));
        // Also write to handover log for logistics visibility
        try {
          const hlog = JSON.parse(sessionStorage.getItem('rrx_handover_log') || '[]');
          hlog.unshift({ id:`PREP-${Date.now()}`, asset:'GE Revolution CT', clinic:'Carrier Handoff', date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}).toUpperCase(), status:'VERIFIED', type:'Heavy Transit', tech:'Deployment Prep', amount:'TBD' });
          sessionStorage.setItem('rrx_handover_log', JSON.stringify(hlog.slice(0,50)));
        } catch {}
      } catch {}
      setReleasing(false);
      setReleased(true);
    }, 2500);
  };

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  if (released) return (
    <div className="max-w-xl mx-auto pt-24 text-center pb-20">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring'}}>
        <Truck size={80} className="text-primary mx-auto mb-8"/>
      </motion.div>
      <h2 className="text-4xl font-black tracking-tighter text-primary mb-4">Released to Carrier</h2>
      <p className="text-sm font-bold opacity-50 uppercase text-primary mb-10">GE Revolution CT cleared for transit. Carrier notified. Chain-of-custody initiated. ETA Boston General: 18:00.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={()=>navigate('/tech')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Ops Center</button>
        <button onClick={()=>navigate('/tech/service-orders')} className="glass-panel px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary">Service Orders</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <button onClick={()=>navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/10 text-[10px] font-black uppercase mb-3 text-secondary border border-secondary/20">
            <ClipboardCheck size={14}/> Protocol: Ready-For-Service (RFS)
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Deployment Prep</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] text-primary">Target Site</p>
          <p className="text-sm font-bold text-primary italic">Boston General</p>
          <p className="text-[10px] font-black text-secondary uppercase">18:00 DEP</p>
        </div>
      </div>

      {/* ASSET CARD */}
      <div className={`${glass} bg-primary text-white border-none`}>
        <div className="flex flex-col md:flex-row justify-between gap-8 items-center">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center"><Zap size={32} className="text-secondary"/></div>
            <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase italic">GE Revolution CT</h3>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Serial: #RX-2022-88</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center px-6 border-r border-white/10">
              <p className="text-[10px] font-black opacity-40 uppercase">Health Score</p>
              <p className="text-xl font-black">99%</p>
            </div>
            <div className="text-center px-6 border-r border-white/10">
              <p className="text-[10px] font-black opacity-40 uppercase">Prep Progress</p>
              <p className="text-xl font-black text-secondary">{pct}%</p>
            </div>
            <div className="text-center px-6">
              <p className="text-[10px] font-black opacity-40 uppercase">Clean Status</p>
              <p className="text-xl font-black text-emerald-400">{checked.includes(1)?'CERTIFIED':'PENDING'}</p>
            </div>
          </div>
        </div>
        {/* PROGRESS BAR */}
        <div className="mt-8 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div animate={{width:`${pct}%`}} transition={{duration:0.5}}
            className="h-full bg-secondary rounded-full"/>
        </div>
      </div>

      {/* CHECKLIST */}
      <div className="space-y-3">
        {PROTOCOLS.map((step, i) => (
          <motion.div key={step.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}
            onClick={() => toggle(step.id)}
            className={`p-8 rounded-[2.5rem] border cursor-pointer transition-all flex items-center justify-between ${
              checked.includes(step.id)
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-white/40 border-white hover:bg-white'
            }`}>
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl transition-colors ${checked.includes(step.id)?'bg-emerald-500 text-white':'bg-primary/5 text-primary'}`}>
                <step.icon size={22}/>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className={`text-lg font-black uppercase tracking-tight text-primary ${checked.includes(step.id)?'line-through opacity-30':''}`}>{step.task}</h4>
                  {step.required && <span className="text-[8px] font-black uppercase text-red-400 bg-red-50 px-2 py-0.5 rounded-full">Required</span>}
                </div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-primary">{step.desc}</p>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${checked.includes(step.id)?'bg-emerald-500 border-emerald-500 text-white':'border-primary/10'}`}>
              {checked.includes(step.id) && <CheckCircle2 size={22}/>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* PHOTO UPLOAD */}
      <div className={glass}>
        <h3 className="text-xl font-black italic uppercase mb-6 text-primary">Departure Photo Evidence</h3>
        <label className="flex items-center gap-4 p-6 border-2 border-dashed border-primary/10 rounded-[2rem] hover:bg-white/40 transition-all cursor-pointer mb-4">
          <Upload className="text-secondary" size={22}/>
          <span className="text-[10px] font-black uppercase text-primary opacity-60">Attach 360° Inspection Photos (min 8)</span>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e=>setPhotos(prev=>[...prev,...Array.from(e.target.files)])}/>
          {photos.length>0 && <span className="ml-auto text-[10px] font-black text-secondary">{photos.length} photo{photos.length>1?'s':''}</span>}
        </label>
        {photos.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {photos.map((f,i)=>(
              <div key={i} className="relative">
                <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center">
                  <Camera size={24} className="text-primary opacity-30"/>
                </div>
                <button onClick={()=>setPhotos(prev=>prev.filter((_,j)=>j!==i))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={10}/>
                </button>
                <p className="text-[8px] font-bold opacity-40 text-primary truncate w-20 text-center mt-1">{f.name}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <p className="text-[10px] font-black uppercase opacity-30 mb-2 text-primary">Transit Notes</p>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Any special handling instructions for the carrier..."
            className="w-full glass-panel px-8 py-5 rounded-[2rem] font-bold bg-white/50 outline-none h-24 resize-none text-primary focus:ring-2 ring-secondary"/>
        </div>
      </div>

      {/* RELEASE SECTION */}
      <div className={`${glass} ${requiredDone?'border-emerald-500/30 bg-emerald-500/5':'border-amber-500/20 bg-amber-500/5'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            {requiredDone
              ? <ShieldCheck className="text-emerald-500 shrink-0" size={32}/>
              : <AlertCircle className="text-amber-500 shrink-0" size={32}/>
            }
            <div>
              <h4 className="text-xl font-black uppercase tracking-tighter italic text-primary">
                {allDone?"All Clear for Departure":requiredDone?"Required Steps Complete":"Preparation Pending"}
              </h4>
              <p className="text-[10px] font-bold opacity-40 uppercase max-w-sm text-primary">
                {allDone
                  ? "All RFS protocols met. Asset locked and sanitized for transit."
                  : requiredDone
                    ? `Optional steps remaining: ${PROTOCOLS.filter(p=>!p.required&&!checked.includes(p.id)).map(p=>p.task).join(', ')}.`
                    : `Complete required steps: ${required.filter(p=>!checked.includes(p.id)).map(p=>p.task).join(', ')}.`
                }
              </p>
            </div>
          </div>
          <button onClick={doRelease} disabled={!requiredDone||releasing}
            className={`px-12 py-6 rounded-3xl font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${
              requiredDone
                ? 'bg-primary text-white hover:bg-secondary hover:text-primary shadow-xl shadow-primary/20'
                : 'bg-primary/5 text-primary/20 cursor-not-allowed'
            } disabled:opacity-60`}>
            {releasing?<><Loader size={20} className="animate-spin"/> Releasing…</>:<><Truck size={20}/> Release to Carrier</>}
          </button>
        </div>
      </div>
    </div>
  );
}