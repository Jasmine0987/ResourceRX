import { useClinic } from '../../context/ClinicContext';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package, Box, Truck, RotateCcw, AlertCircle, Plus,
  QrCode, ClipboardList, Search, Zap, ChevronLeft,
  Loader, X, CheckCircle2, Download, Minus
} from 'lucide-react';

const INIT_INVENTORY = [
  { id:"PRT-901", name:"Cryo-Compressor Seal",      category:"MRI Parts",   qty:2, minQty:1, status:"In Stock",     unitCost:35000  },
  { id:"PRT-442", name:"High-Voltage Cable Set",    category:"CT Hardware", qty:1, minQty:2, status:"Low Stock",    unitCost:56800  },
  { id:"PRT-118", name:"Helium Refill Valve",       category:"Consumables", qty:5, minQty:2, status:"In Stock",     unitCost:7900   },
  { id:"PRT-009", name:"Digital X-Ray Grid",        category:"Imaging",     qty:0, minQty:1, status:"Out of Stock", unitCost:104000 },
  { id:"PRT-330", name:"RF Coil Connector Set",     category:"MRI Parts",   qty:3, minQty:2, status:"In Stock",     unitCost:25900  },
  { id:"PRT-210", name:"Gradient Amplifier Module", category:"MRI Parts",   qty:1, minQty:1, status:"Low Stock",    unitCost:175000 },
  { id:"PRT-551", name:"CT Collimator Assembly",    category:"CT Hardware", qty:2, minQty:1, status:"In Stock",     unitCost:89000  },
  { id:"PRT-762", name:"Dialysis Blood Tubing Set", category:"Consumables", qty:12,minQty:5, status:"In Stock",     unitCost:1200   },
];

const STATUS_STYLE = {
  "In Stock":     "bg-emerald-500/10 text-emerald-600",
  "Low Stock":    "bg-amber-500/10 text-amber-600",
  "Out of Stock": "bg-red-500/10 text-red-500",
};

function downloadCSV(items) {
  const csv = ['ID,Name,Category,Qty,Status,Unit Cost (INR)',...items.map(i=>`${i.id},${i.name},${i.category},${i.qty},${i.status},₹${i.unitCost.toLocaleString('en-IN')}`)].join('\n');
  const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='TechInventory.csv'; a.click();
}

export default function TechInventory() {
  const navigate  = useNavigate();
  const [items,      setItems]     = useState(() => {
    try {
      const saved = sessionStorage.getItem('rrx_tech_inventory');
      return saved ? JSON.parse(saved) : INIT_INVENTORY;
    } catch { return INIT_INVENTORY; }
  });
  const [query,      setQuery]     = useState('');
  const [catFilter,  setCatFilter] = useState('All');
  const [requesting, setRequesting]= useState(null);
  const [requested,  setRequested] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('rrx_tech_requested') || '[]'); } catch { return []; }
  });
  const [scanning,   setScanning]  = useState(false);
  const [showQR,     setShowQR]    = useState(false);
  const [scannedName,setScannedName]= useState('');

  const cats = ['All',...[...new Set(items.map(i=>i.category))]];

  const filtered = items.filter(it => {
    const q = query.toLowerCase();
    const matchQ = !q || it.name.toLowerCase().includes(q) || it.id.toLowerCase().includes(q) || it.category.toLowerCase().includes(q);
    const matchC = catFilter==='All' || it.category===catFilter;
    return matchQ && matchC;
  });

  const adjust = (id, delta) => {
    setItems(prev => {
      const updated = prev.map(it => {
        if (it.id!==id) return it;
        const newQty = Math.max(0, it.qty+delta);
        const newStatus = newQty===0?'Out of Stock':newQty<it.minQty?'Low Stock':'In Stock';
        return {...it, qty:newQty, status:newStatus};
      });
      sessionStorage.setItem('rrx_tech_inventory', JSON.stringify(updated));
      return updated;
    });
  };

  const requestPart = (id) => {
    setRequesting(id);
    setTimeout(() => {
      setRequested(prev => {
        const updated = [...prev, id];
        sessionStorage.setItem('rrx_tech_requested', JSON.stringify(updated));
        return updated;
      });
      // Also log the part request
      const item = items.find(i=>i.id===id);
      if (item) {
        try {
          const reqs = JSON.parse(sessionStorage.getItem('rrx_part_requests_log') || '[]');
          reqs.unshift({ id, name:item.name, qty:item.minQty - item.qty, requestedAt: new Date().toLocaleString(), status:'Requested' });
          sessionStorage.setItem('rrx_part_requests_log', JSON.stringify(reqs.slice(0,20)));
        } catch {}
      }
      setRequesting(null);
    }, 1800);
  };

  const simulateScan = () => {
    setScanning(true);
    setShowQR(true);
    setTimeout(() => {
      const SCANNED_PARTS = ["Magnetic Shim Set","Cryo Valve Assembly","RF Coil Pin Set","Gantry Lock Bolt Kit","Coolant Hose 8mm"];
      const partName = SCANNED_PARTS[Math.floor(Math.random()*SCANNED_PARTS.length)];
      setScannedName(partName);
      const newPart = {
        id:`PRT-${700+Math.floor(Math.random()*200)}`,
        name: partName,
        category:"MRI Parts", qty:2, minQty:1, status:"In Stock", unitCost:Math.floor(15000+Math.random()*50000)
      };
      setItems(prev => {
        const updated = [newPart,...prev];
        sessionStorage.setItem('rrx_tech_inventory', JSON.stringify(updated));
        return updated;
      });
      setScanning(false);
      setCatFilter('All'); // reset filter so scanned item is always visible
      setTimeout(()=>setShowQR(false), 800);
    }, 2500);
  };

  const totalValue = items.reduce((s,i)=>s+i.qty*i.unitCost,0);
  const lowCount   = items.filter(i=>i.status!=='In Stock').length;
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase mb-3 text-primary border border-primary/20">
            <Truck size={12} className="text-secondary"/> Unit Van: RRX-MOBILE-04
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Tactical Inventory</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={simulateScan} disabled={scanning}
            className={`glass-panel p-5 rounded-3xl border border-white hover:bg-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase text-primary ${scanning?'opacity-60':''}`}>
            {scanning?<Loader size={20} className="animate-spin text-primary"/>:<QrCode size={22} className="text-primary"/>}
            {scanning?'Scanning…':'Scan QR'}
          </button>
          <button onClick={()=>downloadCSV(items)}
            className="glass-panel px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-white/60 transition-all flex items-center gap-2">
            <Download size={16}/> Export
          </button>
        </div>
      </div>

      {/* QR SCAN OVERLAY */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
            className="glass-panel p-10 rounded-[3rem] border-2 border-secondary/30 flex items-center gap-8 bg-secondary/5">
            <div className="w-20 h-20 border-4 border-secondary rounded-2xl flex items-center justify-center">
              {scanning?<Loader size={32} className="animate-spin text-secondary"/>:<CheckCircle2 size={32} className="text-emerald-500"/>}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-secondary mb-1">{scanning?'Scanning QR Code…':'Part Registered!'}</p>
              <p className="text-xl font-black text-primary">{scanning?'Hold steady…':`${scannedName || 'Part'} added to inventory`}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label:"Van Capacity",     val:"84%",          sub:"420kg / 500kg",         icon:Package,     color:"text-primary"     },
          { label:"Parts Needing Attention", val:lowCount.toString().padStart(2,'0'), sub:"Low or out of stock", icon:AlertCircle, color:"text-red-500" },
          { label:"Inventory Value",  val:`₹${(totalValue/100000).toFixed(1)}L`, sub:`${items.length} SKUs tracked`, icon:RotateCcw, color:"text-secondary" },
        ].map((stat,i) => (
          <div key={i} className="glass-panel p-8 rounded-[2.5rem] flex items-center gap-6">
            <div className={`p-5 rounded-2xl bg-white/50 ${stat.color} shadow-inner`}><stat.icon size={26}/></div>
            <div>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tighter text-primary">{stat.val}</h3>
              <p className="text-[9px] font-bold opacity-50 uppercase tracking-tighter text-primary">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH + CATEGORY FILTER */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-64">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 text-primary" size={16}/>
          <input type="text" value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search part name, ID, or category..."
            className="w-full glass-panel pl-14 pr-8 py-5 rounded-[2rem] font-bold text-xs bg-white/40 outline-none text-primary focus:ring-2 ring-secondary/30"/>
          {query && <button onClick={()=>setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"><X size={14} className="text-primary"/></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${catFilter===c?'bg-primary text-white':'glass-panel text-primary opacity-60 hover:opacity-100'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* PARTS REGISTRY */}
      <div className={glass}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary flex items-center gap-3">
            <Box className="text-secondary"/> Parts Registry
          </h3>
          <div className="text-[10px] font-black opacity-30 uppercase text-primary flex items-center gap-2">
            <ClipboardList size={14}/> {filtered.length} items shown
          </div>
        </div>
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((item,i) => (
              <motion.div key={item.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{delay:i*0.04}}
                className="group flex flex-col md:flex-row md:items-center justify-between p-8 bg-white/40 rounded-[2.5rem] border border-white hover:bg-white/80 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary/30 font-black text-[10px]">
                    {item.category.substring(0,3).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[9px] font-black opacity-30 uppercase tracking-widest text-primary">{item.id} · ₹{item.unitCost.toLocaleString('en-IN')}/unit</p>
                    <h4 className="text-sm font-black uppercase tracking-tight text-primary">{item.name}</h4>
                    <p className="text-[10px] font-bold opacity-40 uppercase text-primary">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-6 md:mt-0">
                  {/* QTY ADJUSTER */}
                  <div className="flex items-center gap-3">
                    <button onClick={()=>adjust(item.id,-1)} className="w-8 h-8 rounded-full bg-primary/5 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all text-primary">
                      <Minus size={14}/>
                    </button>
                    <span className="text-xl font-black text-primary w-6 text-center">{item.qty}</span>
                    <button onClick={()=>adjust(item.id,+1)} className="w-8 h-8 rounded-full bg-primary/5 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition-all text-primary">
                      <Plus size={14}/>
                    </button>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                  {item.status !== 'In Stock' && (
                    <button onClick={()=>requestPart(item.id)} disabled={!!requesting||requested.includes(item.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${requested.includes(item.id)?'bg-emerald-100 text-emerald-700':'bg-primary text-white hover:bg-secondary hover:text-primary shadow-lg shadow-primary/20'} disabled:opacity-50`}>
                      {requesting===item.id?<Loader size={12} className="animate-spin"/>:requested.includes(item.id)?<CheckCircle2 size={12}/>:<Plus size={12}/>}
                      {requesting===item.id?'Requesting…':requested.includes(item.id)?'Requested':'Request Part'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length===0 && (
            <div className="py-12 text-center opacity-30"><Search size={32} className="text-primary mx-auto mb-3"/><p className="font-black uppercase text-primary text-sm">No parts match your search</p></div>
          )}
        </div>
      </div>

      {/* PART REQUESTS LOG — shows where requested parts go */}
      {requested.length > 0 && (() => {
        const reqLog = (() => { try { return JSON.parse(sessionStorage.getItem('rrx_part_requests_log') || '[]'); } catch { return []; } })();
        return (
          <div className="glass-panel p-8 rounded-[3rem] border border-secondary/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-5 text-primary">Part Requests Submitted ({reqLog.length})</h4>
            <div className="space-y-3">
              {reqLog.slice(0,5).map((r,i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div>
                    <p className="font-black text-xs uppercase text-primary">{r.name}</p>
                    <p className="text-[9px] font-bold text-emerald-700 uppercase">Qty: {r.qty} · Requested at {r.requestedAt}</p>
                  </div>
                  <span className="text-[8px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* SMART RESTOCK BANNER */}
      <div className="p-10 rounded-[3.5rem] bg-primary text-white flex flex-col md:flex-row items-center gap-10">
        <div className="shrink-0 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
          <Zap size={32} className="text-secondary" fill="currentColor"/>
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-2xl font-black italic uppercase tracking-tighter">Smart Restock Active</h4>
          <p className="text-xs font-bold opacity-60 leading-relaxed uppercase">Based on your next 3 missions at Mercy Hospital, the system has pre-ordered 02 Magnetic Shims and 01 Cooling Fan for delivery to your next site.</p>
        </div>
        <button onClick={()=>navigate('/tech/service-orders')}
          className="bg-secondary text-primary px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap">
          View Shipment →
        </button>
      </div>
    </div>
  );
}