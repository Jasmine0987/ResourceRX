import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Shield, Truck, Wifi, ChevronLeft, CheckCircle2, User, Globe, Lock } from 'lucide-react';

const SETTING_GROUPS = [
  {
    icon: Bell, label: 'Notifications', color: 'text-secondary',
    settings: [
      { id:'n1', label:'Dispatch Alerts',        desc:'Get notified on new assignments',        enabled:true  },
      { id:'n2', label:'ETA Warnings',            desc:'Alert when transit exceeds estimated time',enabled:true  },
      { id:'n3', label:'Incident Notifications',  desc:'Immediate alert on filed incidents',       enabled:true  },
      { id:'n4', label:'Handover Confirmations',  desc:'Notify on successful delivery sign-off',   enabled:false },
    ],
  },
  {
    icon: Shield, label: 'Security', color: 'text-emerald-500',
    settings: [
      { id:'s1', label:'Two-Factor Auth',         desc:'Require 2FA for contract actions',         enabled:true  },
      { id:'s2', label:'Session Timeout (30m)',   desc:'Auto-lock after inactivity',               enabled:true  },
      { id:'s3', label:'Audit Trail Logging',     desc:'Log all portal actions to immutable chain',enabled:true  },
    ],
  },
  {
    icon: Truck, label: 'Dispatch Preferences', color: 'text-amber-500',
    settings: [
      { id:'d1', label:'Auto-Accept Low Risk',    desc:'Auto-accept P3 assignments under 50km',    enabled:false },
      { id:'d2', label:'Show Queue Position',     desc:'Display your rank in assignment pool',      enabled:true  },
      { id:'d3', label:'GPS Background Mode',     desc:'Continue tracking when app is minimized',  enabled:true  },
    ],
  },
  {
    icon: Wifi, label: 'Connectivity', color: 'text-blue-500',
    settings: [
      { id:'c1', label:'Offline Mode Cache',      desc:'Cache last 24h of data for offline use',   enabled:true  },
      { id:'c2', label:'High-Accuracy GPS',       desc:'Use device GPS for precise positioning',   enabled:true  },
      { id:'c3', label:'Mesh Network Relay',      desc:'Relay signals to nearby RRX units',        enabled:false },
    ],
  },
];

export default function LogisticsSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() =>
    Object.fromEntries(SETTING_GROUPS.flatMap(g => g.settings).map(s => [s.id, s.enabled]))
  );
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ name:'Elias Thorne', id:'RRX-4492-T', region:'Northeast Corridor', level:'4' });

  const toggle = (id) => setSettings(prev => ({ ...prev, [id]: !prev[id] }));

  const save = () => {
    setSaved(true);
    try { sessionStorage.setItem('rrx_logistics_settings', JSON.stringify(settings)); } catch {}
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6 px-4 space-y-8">

      <div>
        <button onClick={() => navigate('/logistics')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
          <ChevronLeft size={14}/> Fleet Command
        </button>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-3 text-primary">
          <Settings size={12} className="text-secondary"/> Operator Configuration
        </div>
        <h2 className="text-4xl font-black tracking-tighter italic text-primary">Settings</h2>
      </div>

      {/* PROFILE CARD */}
      <div className="glass-panel p-8 rounded-[3rem] flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
          <User size={28}/>
        </div>
        <div className="flex-1">
          <p className="font-black text-xl tracking-tighter text-primary">{profile.name}</p>
          <p className="text-[10px] font-bold text-secondary uppercase">{profile.id} · Level {profile.level} Technician</p>
          <p className="text-[10px] font-bold opacity-40 uppercase text-primary mt-1">{profile.region}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">Active</span>
          <span className="text-[8px] font-black bg-secondary/20 text-primary px-3 py-1 rounded-full uppercase">Verified</span>
        </div>
      </div>

      {/* SETTING GROUPS */}
      {SETTING_GROUPS.map((group, gi) => (
        <motion.div key={gi} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:gi*0.08}}
          className="glass-panel p-8 rounded-[3rem] space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <group.icon size={20} className={group.color}/>
            <h3 className="text-lg font-black tracking-tighter uppercase text-primary">{group.label}</h3>
          </div>
          {group.settings.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-all">
              <div className="flex-1 mr-4">
                <p className="font-black text-xs uppercase tracking-tight text-primary">{s.label}</p>
                <p className="text-[10px] font-bold opacity-40 text-primary mt-0.5">{s.desc}</p>
              </div>
              <button
                onClick={() => toggle(s.id)}
                className={`relative w-12 h-6 rounded-full transition-all shrink-0 ${settings[s.id] ? 'bg-secondary' : 'bg-primary/10'}`}
              >
                <motion.div
                  animate={{ x: settings[s.id] ? 24 : 2 }}
                  transition={{ type:'spring', stiffness:500, damping:30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
          ))}
        </motion.div>
      ))}

      {/* SAVE */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={save}
          className={`flex-1 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${saved?'bg-emerald-500 text-white':'bg-primary text-white hover:bg-secondary hover:text-primary'}`}>
          {saved ? <><CheckCircle2 size={18}/> Saved!</> : <><Settings size={18}/> Save Settings</>}
        </button>
        <button onClick={() => navigate('/logistics')}
          className="px-10 glass-panel rounded-3xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-white/60 transition-all">
          Cancel
        </button>
      </div>

    </div>
  );
}