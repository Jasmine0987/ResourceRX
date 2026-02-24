import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Navigation, ShieldCheck, Clock, Search, Filter, ExternalLink, Activity, ChevronLeft, Download } from 'lucide-react';

const DEPLOYMENTS_INIT = [
  { id:"DEP-992", asset:"Siemens Magnetom Sola", status:"In Transit", destination:"Central Mercy Clinic", eta:14, progress:65, severity:"High", origin:"Long Island NY" },
  { id:"DEP-884", asset:"GE Revolution CT", status:"On Site", destination:"Northwell Health NY", eta:0, progress:100, severity:"Standard", origin:"Hartford CT" },
  { id:"DEP-771", asset:"Dialysis System V4", status:"Pending Pickup", destination:"City General", eta:0, progress:10, severity:"Standard", origin:"Newark NJ" },
];

const HISTORY = [
  { id:"RX-ALPHA-01", partner:"Starlink Logistics #4491", date:"Jan 12, 2026", asset:"Siemens MRI" },
  { id:"RX-ALPHA-02", partner:"MedFleet Partners #8820", date:"Jan 10, 2026", asset:"GE CT Scanner" },
  { id:"RX-ALPHA-03", partner:"Starlink Logistics #4491", date:"Jan 08, 2026", asset:"Dialysis V3"  },
];

function downloadCSV() {
  const csv = ['ID,Asset,Partner,Date',...HISTORY.map(h=>`${h.id},${h.asset},${h.partner},${h.date}`)].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='Dispatch_History.csv'; a.click();
}

function getSessionDispatches() {
  try { return JSON.parse(sessionStorage.getItem('rrx_owner_dispatches') || '[]'); } catch { return []; }
}

export default function OwnerDispatch() {
  const navigate = useNavigate();
  
  const [deps, setDeps] = useState(() => {
    const session = getSessionDispatches().map(d => ({
      id: d.id,
      asset: d.asset,
      status: 'In Transit',
      destination: d.facility,
      eta: 20,
      progress: 5,
      severity: 'Standard',
      origin: d.location,
    }));
    return [...session, ...DEPLOYMENTS_INIT];
  });
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      setDeps(prev => prev.map(d =>
        d.status==='In Transit' ? {...d, progress: Math.min(100, d.progress+1), eta: Math.max(0,d.eta-1)} : d
      ));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const filtered = deps.filter(d => !query || d.asset.toLowerCase().includes(query.toLowerCase()) || d.id.toLowerCase().includes(query.toLowerCase()) || d.destination.toLowerCase().includes(query.toLowerCase()));

  const STATUS = { 'In Transit':'bg-secondary/10 text-secondary', 'On Site':'bg-emerald-500/10 text-emerald-600', 'Pending Pickup':'bg-amber-500/10 text-amber-600' };
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity"><ChevronLeft size={14}/> Control Center</button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-3 text-primary"><Truck size={14} className="text-secondary"/> Live Asset Tracking</div>
          <h2 className="text-5xl font-black tracking-tighter italic text-primary">Deployment Logs</h2>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20 text-primary" size={16}/>
            <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search asset or clinic..."
              className="glass-panel pl-12 pr-8 py-4 rounded-3xl font-bold text-xs outline-none w-72 text-primary placeholder:opacity-40 focus:ring-2 ring-secondary"/>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black ml-2 uppercase tracking-widest opacity-30 text-primary flex items-center gap-2"><Activity size={16}/> Active Movements</h3>
          {filtered.map((dep, i) => (
            <motion.div key={dep.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}}
              className={`${glass} hover:border-secondary/30`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary border border-white/50 shadow-inner">
                    <Navigation size={26} className={dep.status==="In Transit"?"animate-pulse":""}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1 text-primary">{dep.id}</p>
                    <h4 className="text-2xl font-black tracking-tighter uppercase italic text-primary">{dep.asset}</h4>
                    <p className="text-[10px] opacity-40 font-bold uppercase text-primary">{dep.origin} → {dep.destination}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${STATUS[dep.status]||'bg-primary/10 text-primary'}`}>{dep.status}</span>
                  {dep.eta > 0 && <p className="text-xl font-black mt-2 text-primary">{dep.eta}m remaining</p>}
                  {dep.progress === 100 && <p className="text-sm font-black text-emerald-500 mt-2">ARRIVED ✓</p>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase opacity-40 text-primary">
                  <span>Transit path</span><span>{dep.progress}% Complete</span>
                </div>
                <div className="h-2 bg-primary/5 rounded-full overflow-hidden">
                  <motion.div animate={{width:`${dep.progress}%`}} transition={{duration:0.5}}
                    className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_rgba(168,218,220,0.5)] rounded-full"/>
                </div>
                <div className="flex items-center gap-8 pt-4 border-t border-primary/5">
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-secondary"/><span className="text-xs font-bold uppercase text-primary">{dep.destination}</span></div>
                  <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/><span className="text-[10px] font-black opacity-40 uppercase text-primary">Chain of Custody Verified</span></div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <div className="glass-panel p-12 rounded-[3rem] text-center opacity-30"><p className="font-black uppercase text-primary text-sm">No deployments match your search</p></div>}
        </div>

        <div className="space-y-6">
          <div className={glass}>
            <h3 className="text-lg font-black mb-8 uppercase italic tracking-tighter text-primary">System Audit</h3>
            <div className="space-y-5">
              {[{label:"Total Deployments",val:"1,240"},{label:"Avg. Transit Time",val:"4.2 Hrs"},{label:"Incidents (Q1)",val:"0.02%"},{label:"Partner Carriers",val:"18"}].map((s,i)=>(
                <div key={i} className="flex justify-between items-center pb-4 border-b border-primary/5 last:border-0">
                  <span className="text-[10px] font-black opacity-30 uppercase text-primary">{s.label}</span>
                  <span className="font-black text-sm text-primary">{s.val}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>navigate('/owner/settlements')} className="w-full mt-8 bg-primary text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all">View Settlements →</button>
          </div>
          <div className={`${glass} bg-secondary/10 border-secondary/20 flex flex-col items-center text-center`}>
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-secondary mb-6 shadow-sm"><Clock size={24}/></div>
            <h4 className="text-lg font-black uppercase tracking-tighter text-primary">Schedule Next Move</h4>
            <p className="text-[10px] font-bold opacity-50 uppercase mt-2 mb-6 leading-relaxed text-primary">Pre-book transit for assets ending their current rental period.</p>
            <button onClick={()=>navigate('/owner/requests')} className="text-[10px] font-black uppercase text-primary hover:text-secondary transition-colors">Open Requests →</button>
          </div>
        </div>
      </div>

      <div className={glass}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black tracking-tighter uppercase italic text-primary">Transit History</h3>
          <button onClick={downloadCSV} className="text-[10px] font-black opacity-30 uppercase hover:opacity-100 transition-opacity flex items-center gap-2 text-primary"><Download size={14}/> Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] text-primary">
                <th className="px-6 pb-4">Asset ID</th><th className="px-6 pb-4">Asset</th><th className="px-6 pb-4">Logistics Partner</th><th className="px-6 pb-4">Date</th><th className="px-6 pb-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map(row => (
                <tr key={row.id} className="bg-white/40 rounded-3xl overflow-hidden group hover:bg-white/60 transition-all">
                  <td className="px-6 py-5 font-bold text-xs rounded-l-3xl text-primary">{row.id}</td>
                  <td className="px-6 py-5 text-xs font-black uppercase text-primary">{row.asset}</td>
                  <td className="px-6 py-5 text-xs font-black uppercase text-primary">{row.partner}</td>
                  <td className="px-6 py-5 text-xs opacity-50 text-primary">{row.date}</td>
                  <td className="px-6 py-5 text-right rounded-r-3xl">
                    <button onClick={()=>navigate('/owner/analytics')} className="p-2 hover:bg-primary/5 rounded-lg transition-colors text-secondary hover:text-primary" title="View Analytics"><ExternalLink size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}