import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Search, Filter, ShieldCheck,
  ExternalLink, Calendar, Package, Clock, ChevronLeft,
  ChevronDown, CheckCircle2, AlertTriangle, X
} from 'lucide-react';

const ALL_LOGS = [
  { id: "LOG-RX-882", asset: "Siemens Magnetom Sola",   clinic: "Summit Health NJ",    date: "JAN 12, 2026", status: "VERIFIED",  type: "Heavy Transit", tech: "E. Thorne",   amount: "$4,800" },
  { id: "LOG-RX-774", asset: "GE Revolution CT",         clinic: "Northwell Health NY", date: "JAN 10, 2026", status: "VERIFIED",  type: "Emergency",    tech: "S. Chen",     amount: "$3,200" },
  { id: "LOG-RX-441", asset: "Dialysis System V4",       clinic: "City General",        date: "JAN 08, 2026", status: "ARCHIVED",  type: "Standard",     tech: "J. Park",     amount: "$1,400" },
  { id: "LOG-RX-112", asset: "Mobile X-Ray Unit",        clinic: "Mercy Hospital",      date: "JAN 05, 2026", status: "VERIFIED",  type: "Heavy Transit", tech: "E. Thorne",   amount: "$900"   },
  { id: "LOG-RX-099", asset: "Ventilator Array (x4)",    clinic: "Boston Med Center",   date: "DEC 28, 2025", status: "INCIDENT",  type: "Emergency",    tech: "A. Kumar",    amount: "$2,100" },
  { id: "LOG-RX-066", asset: "Philips CT 256",           clinic: "Penn Medicine",       date: "DEC 20, 2025", status: "VERIFIED",  type: "Standard",     tech: "S. Chen",     amount: "$3,600" },
  { id: "LOG-RX-043", asset: "Portable Ultrasound",      clinic: "Cleveland Clinic",    date: "DEC 15, 2025", status: "ARCHIVED",  type: "Standard",     tech: "J. Park",     amount: "$500"   },
];

const STATUS_STYLE = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
  INCIDENT: "bg-red-100 text-red-600",
};

const TYPE_FILTER = ["All", "Heavy Transit", "Emergency", "Standard"];

function downloadCSV(logs, filename = 'ResourceRX_Handover_Registry.csv') {
  const headers = ["ID", "Asset", "Clinic", "Date", "Status", "Type", "Tech", "Amount"];
  const rows = logs.map(l => [l.id, l.asset, l.clinic, l.date, l.status, l.type, l.tech, l.amount]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LogisticsLogs() {
  const navigate = useNavigate();
  const [query, setQuery]       = useState('');
  const [typeFilter, setType]   = useState('All');
  const [showFilter, setFilter] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Load logs from session (filed during this session) + merge with static
  const allLogs = useMemo(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem('rrx_handover_log') || '[]');
      return [...session, ...ALL_LOGS];
    } catch { return ALL_LOGS; }
  }, []);

  const filtered = useMemo(() => {
    return allLogs.filter(l => {
      const q = query.toLowerCase();
      const matchQ = !q || l.id.toLowerCase().includes(q) || l.asset.toLowerCase().includes(q) || l.clinic.toLowerCase().includes(q);
      const matchT = typeFilter === 'All' || l.type === typeFilter;
      return matchQ && matchT;
    });
  }, [query, typeFilter]);

  const verified = filtered.filter(l => l.status === 'VERIFIED').length;
  const incidents = filtered.filter(l => l.status === 'INCIDENT').length;

  return (
    <div className="pt-20 pb-20 px-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => navigate('/logistics')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14} /> Fleet Command
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-3 text-primary">
            <ShieldCheck size={14} className="text-emerald-500" />
            Immutable Audit Trail · Protocol 10-C
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic text-primary">Handover Registry</h2>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20 text-primary" size={16} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search asset, clinic, or log ID..."
              className="glass-panel pl-12 pr-8 py-4 rounded-3xl font-bold text-xs outline-none w-72 focus:ring-1 ring-secondary/50 text-primary transition-all placeholder:opacity-40"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                <X size={14} className="text-primary" />
              </button>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setFilter(!showFilter)} className="glass-panel px-5 py-4 rounded-3xl flex items-center gap-2 hover:bg-white/60 transition-all text-primary">
              <Filter size={16} className="opacity-60" />
              <span className="text-[10px] font-black uppercase">{typeFilter}</span>
              <ChevronDown size={12} className="opacity-40" />
            </button>
            <AnimatePresence>
              {showFilter && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute right-0 top-14 glass-panel p-3 rounded-2xl z-20 w-48 shadow-xl space-y-1">
                  {TYPE_FILTER.map(t => (
                    <button key={t} onClick={() => { setType(t); setFilter(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter===t ? 'bg-primary text-white' : 'hover:bg-white/60 text-primary'}`}>
                      {t}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">

        {/* SIDEBAR */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[3rem]">
            <p className="text-[10px] font-black opacity-30 uppercase mb-6 tracking-widest text-primary">Summary</p>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold opacity-60 text-primary uppercase">Showing</span>
                <span className="font-black text-2xl tracking-tighter text-primary">{filtered.length}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-500">
                <span className="text-xs font-bold uppercase">Verified</span>
                <span className="font-black text-xl text-emerald-600">{verified}</span>
              </div>
              {incidents > 0 && (
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-xs font-bold uppercase">Incidents</span>
                  <span className="font-black text-xl">{incidents}</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[3rem] bg-secondary/10 border-secondary/20">
            <Package className="text-secondary mb-4" size={24} />
            <h4 className="text-lg font-black tracking-tighter uppercase mb-2 text-primary">Export Registry</h4>
            <p className="text-[10px] font-bold opacity-50 uppercase leading-relaxed mb-6 text-primary">
              Download full encrypted registry for insurance compliance.
            </p>
            <button onClick={() => downloadCSV(filtered)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-secondary hover:text-primary transition-all">
              <Download size={14} /> Export CSV ({filtered.length})
            </button>
          </div>

          <button onClick={() => navigate('/logistics/incident')}
            className="w-full glass-panel py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
            <AlertTriangle size={14} /> File Incident
          </button>
        </div>

        {/* LOGS LIST */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-16 rounded-[3rem] text-center">
                <Search size={32} className="text-primary/20 mx-auto mb-4" />
                <p className="font-black text-primary/40 uppercase text-sm">No logs match your search</p>
              </motion.div>
            )}
            {filtered.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="glass-panel rounded-[2.5rem] overflow-hidden bg-white/30 hover:bg-white/50 transition-all cursor-pointer"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-white border border-primary/5 flex items-center justify-center text-primary/20">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-black text-lg tracking-tighter uppercase text-primary">{log.asset}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${STATUS_STYLE[log.status]}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex gap-4 items-center flex-wrap">
                        <p className="text-[10px] font-bold opacity-40 uppercase flex items-center gap-1 text-primary">
                          <Calendar size={10} /> {log.date}
                        </p>
                        <p className="text-[10px] font-bold opacity-40 uppercase flex items-center gap-1 text-primary">
                          <Clock size={10} /> {log.type}
                        </p>
                        <p className="text-[10px] font-black text-primary/60 italic">{log.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black opacity-30 uppercase mb-1 text-primary">Clinic</p>
                      <p className="font-bold text-sm text-primary uppercase">{log.clinic}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); downloadCSV([log], `RRX_${log.id}.csv`); }}
                        className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
                        <Download size={16} />
                      </button>
                      {log.status === 'INCIDENT' && (
                        <button onClick={e => { e.stopPropagation(); navigate('/logistics/incident'); }}
                          className="p-3 rounded-2xl bg-red-500 text-white hover:scale-110 transition-transform">
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAIL */}
                <AnimatePresence>
                  {expanded === log.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-primary/5">
                      <div className="p-8 grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-[9px] font-black opacity-30 uppercase mb-1 text-primary">Tech Officer</p>
                          <p className="font-black text-primary">{log.tech}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black opacity-30 uppercase mb-1 text-primary">Transaction</p>
                          <p className="font-black text-primary">{log.amount}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black opacity-30 uppercase mb-1 text-primary">Verification</p>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={14} className={log.status === 'VERIFIED' ? 'text-emerald-500' : 'text-slate-400'} />
                            <p className="font-black text-xs text-primary">{log.status}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          <button className="w-full py-8 text-[10px] font-black uppercase tracking-[0.3em] opacity-20 hover:opacity-60 transition-opacity text-primary">
            Load Historical Archives
          </button>
        </div>
      </div>
    </div>
  );
}