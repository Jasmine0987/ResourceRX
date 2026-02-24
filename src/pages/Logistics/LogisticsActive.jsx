import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Truck, MapPin, Navigation, Timer, PackageCheck, AlertTriangle,
  Camera, ShieldAlert, Activity, CheckCircle2, ScanLine,
  Microscope, Zap, ChevronLeft, Clock, CheckCheck, X, Upload
} from 'lucide-react';

// ── Queue of available dispatch assignments ───────────────────────────────────
const DISPATCH_QUEUE = [
  {
    id: "RRX-ALPHA-09", asset: "Cryo-MRI Scanner", assetSub: "Siemens Magnetom Vida 3T",
    origin: { name: "Bio-Tech Storage Hub", city: "Long Island, NY" },
    dest:   { name: "Central Mercy Clinic",  city: "Newark, NJ"     },
    tech:   { name: "Elias Thorne", id: "RRX-4492-T", level: 4 },
    requirements: ["Nitrogen Levels Critical", "Shock Sensors Active", "Level 4 Tech Required"],
    eta: 14, distance: 38, expirySeconds: 299,
  },
  {
    id: "RRX-BRAVO-22", asset: "GE Revolution CT", assetSub: "GE Revolution CT 512-Slice",
    origin: { name: "Summit Radiology Hub", city: "Hartford, CT" },
    dest:   { name: "St. Luke's Oncology",  city: "Boston, MA"  },
    tech:   { name: "Sandra Chen", id: "RRX-3301-T", level: 3 },
    requirements: ["Gantry Locked for Transit", "Software v12.1 Loaded", "Level 3 Tech Required"],
    eta: 22, distance: 160, expirySeconds: 249,
  },
  {
    id: "RRX-CHARLIE-07", asset: "Dialysis System", assetSub: "Fresenius 5008S × 2",
    origin: { name: "Midwest Medical Cache", city: "Newark, NJ"   },
    dest:   { name: "City General Ward 3",   city: "Philadelphia, PA" },
    tech:   { name: "James Park", id: "RRX-2210-T", level: 2 },
    requirements: ["Membrane Sterility Confirmed", "Consumables Kit Attached", "Level 2 Tech Required"],
    eta: 8, distance: 20, expirySeconds: 179,
  },
  {
    id: "RRX-DELTA-14", asset: "Mobile X-Ray Unit", assetSub: "Philips DigitalDiagnost C90",
    origin: { name: "Emergency Reserve Bay", city: "Brooklyn, NY"  },
    dest:   { name: "Mercy Outpatient Ctr",  city: "Long Island, NY" },
    tech:   { name: "Aisha Kumar", id: "RRX-5540-T", level: 2 },
    requirements: ["Radiation Shielding Checked", "Grid Alignment Verified", "Level 2 Tech Required"],
    eta: 11, distance: 28, expirySeconds: 329,
  },
];

const CHECKLIST = [
  "External Seal Verification",
  "Magnet Stability Check",
  "Coolant Pressure Lock",
  "Inventory Match Confirmed",
  "Receiver Signature Obtained",
];

// Session-persist rejected IDs so they don't reappear
function getRejectedIds() {
  try { return JSON.parse(sessionStorage.getItem('rrx_rejected_dispatches') || '[]'); } catch { return []; }
}
function addRejectedId(id) {
  try {
    const ids = getRejectedIds();
    if (!ids.includes(id)) ids.push(id);
    sessionStorage.setItem('rrx_rejected_dispatches', JSON.stringify(ids));
  } catch {}
}
function getCompletedLog() {
  try { return JSON.parse(sessionStorage.getItem('rrx_handover_log') || '[]'); } catch { return []; }
}
function addToHandoverLog(entry) {
  try {
    const log = getCompletedLog();
    log.unshift(entry);
    sessionStorage.setItem('rrx_handover_log', JSON.stringify(log.slice(0,50)));
  } catch {}
}

export default function LogisticsActive() {
  const navigate = useNavigate();

  // Available queue minus rejected ones — recomputed each render
  const [rejectedIds, setRejectedIds] = useState(() => getRejectedIds());
  const available = DISPATCH_QUEUE.filter(d => !rejectedIds.includes(d.id));
  const [queueIdx, setQueueIdx]       = useState(0);
  // Always pick from available; if all rejected, cycle back to first
  const DISPATCH = available.length > 0
    ? (available[queueIdx % available.length] || available[0])
    : DISPATCH_QUEUE[0];

  const [stage, setStage]                = useState('pickup');
  const [accepted, setAccepted]          = useState(false);
  const [rejected, setRejected]          = useState(false);
  const [expiry, setExpiry]              = useState(DISPATCH.expirySeconds);
  const [eta, setEta]                    = useState(DISPATCH.eta * 60);
  const [checks, setChecks]             = useState({});
  const [photoUploaded, setPhotoUploaded]= useState(false);
  const [signature, setSignature]        = useState('');
  const [finalising, setFinalising]      = useState(false);
  const [velocity, setVelocity]          = useState(42);
  const fileRef = useRef();

  const handleReject = () => {
    addRejectedId(DISPATCH.id);
    const newIds = [...rejectedIds, DISPATCH.id];
    // If all dispatches rejected, reset so queue cycles — prevents fallback to DISPATCH_QUEUE[0]
    if (newIds.length >= DISPATCH_QUEUE.length) {
      sessionStorage.removeItem('rrx_rejected_dispatches');
      setRejectedIds([]);
      setQueueIdx(0);
    } else {
      setRejectedIds(newIds);
      setQueueIdx(i => (i + 1) % DISPATCH_QUEUE.length);
    }
    setRejected(false);
    setStage('pickup');
    setAccepted(false);
    setExpiry(299);
  };

  // Expiry countdown (pickup stage)
  useEffect(() => {
    if (stage !== 'pickup' || accepted || rejected) return;
    const t = setInterval(() => setExpiry(e => Math.max(0, e - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, accepted, rejected]);

  // ETA countdown (route stage)
  useEffect(() => {
    if (stage !== 'route') return;
    const t = setInterval(() => {
      setEta(e => Math.max(0, e - 1));
      setVelocity(v => Math.max(30, Math.min(65, v + (Math.random() - 0.5) * 4)));
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const allChecked = CHECKLIST.every((_, i) => checks[i]);

  const handleFinalize = () => {
    setFinalising(true);
    // Log to handover registry
    addToHandoverLog({
      id: `LOG-${DISPATCH.id}`,
      asset: DISPATCH.assetSub,
      clinic: DISPATCH.dest.name,
      date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }).toUpperCase(),
      status: 'VERIFIED',
      type: 'Heavy Transit',
      tech: DISPATCH.tech.name,
      amount: `$${DISPATCH.distance * 80}`,
    });
    setTimeout(() => navigate('/logistics/logs'), 2000);
  };

  const glassStyle = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="pt-20 pb-20 px-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => navigate('/logistics')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-3 text-primary">
            <ScanLine size={14} className="text-secondary" />
            Active Protocol: {DISPATCH.id}
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic text-primary">Live Dispatch</h2>
        </div>

        {/* STAGE TABS */}
        <div className="glass-panel p-2 rounded-3xl flex gap-1 bg-white/20">
          {[
            { key: 'pickup',   label: 'Pickup'   },
            { key: 'route',    label: 'Route'    },
            { key: 'delivery', label: 'Handover' },
          ].map(({ key, label }) => (
            <button
              key={key}
              disabled={key === 'route' && !accepted}
              onClick={() => setStage(key)}
              className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:pointer-events-none ${
                stage === key ? 'bg-primary text-white shadow-xl' : 'opacity-30 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STAGE 1: PICKUP ASSIGNMENT ── */}
        {stage === 'pickup' && (
          <motion.div key="pickup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-3 gap-8">

            <div className={`lg:col-span-2 ${glassStyle}`}>
              {rejected ? (
                <div className="text-center py-20">
                  <X size={48} className="text-red-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-black text-primary mb-2">Dispatch Rejected</h3>
                  <p className="opacity-40 text-sm font-bold uppercase mb-8">Assignment returned to pool.</p>
                  <button onClick={() => { setRejected(false); setExpiry(DISPATCH.expirySeconds); }}
                    className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                    View Next Assignment
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Asset Class</p>
                      <h3 className="text-4xl font-black tracking-tighter uppercase italic text-primary">{DISPATCH.asset}</h3>
                      <p className="text-sm opacity-50 font-bold mt-1 text-primary">{DISPATCH.assetSub}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black opacity-30 uppercase mb-1">Assignment Expiry</p>
                      <p className={`text-3xl font-black font-mono italic ${expiry < 60 ? 'text-red-500' : 'text-primary'}`}>
                        {fmt(expiry)}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 border-y border-primary/5 py-10 mb-10">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black opacity-30 uppercase mb-2 flex items-center gap-2 text-primary"><MapPin size={12} className="text-secondary" /> Origin Site</p>
                        <p className="font-bold text-lg leading-tight uppercase text-primary">{DISPATCH.origin.name}<br/>
                          <span className="text-xs opacity-50 font-black tracking-widest">{DISPATCH.origin.city}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black opacity-30 uppercase mb-2 flex items-center gap-2 text-primary"><Navigation size={12} className="text-secondary" /> Destination</p>
                        <p className="font-bold text-lg leading-tight uppercase text-primary">{DISPATCH.dest.name}<br/>
                          <span className="text-xs opacity-50 font-black tracking-widest">{DISPATCH.dest.city}</span>
                        </p>
                      </div>
                    </div>
                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-white/50">
                      <p className="text-[10px] font-black opacity-40 uppercase mb-4 tracking-tighter text-primary">Cargo Requirements</p>
                      <ul className="space-y-3">
                        {DISPATCH.requirements.map((req, i) => (
                          <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase text-primary">
                            <div className={`w-1.5 h-1.5 rounded-full ${i===0?'bg-red-500':i===1?'bg-secondary':'bg-primary'}`} />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => { setAccepted(true); setStage('route'); }}
                      className="flex-1 bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-secondary hover:text-primary transition-all"
                    >
                      ✓ Accept Dispatch
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-10 glass-panel rounded-[2rem] font-black uppercase text-red-500 text-[10px] tracking-widest hover:bg-red-50 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* TECH CARD */}
            <div className={`${glassStyle} h-fit text-center flex flex-col items-center`}>
              <div className="w-20 h-20 bg-white rounded-3xl shadow-inner mb-6 flex items-center justify-center text-primary/20">
                <Microscope size={40} />
              </div>
              <p className="text-[10px] font-black opacity-30 uppercase mb-2 text-primary">Technical Lead</p>
              <p className="font-black text-xl tracking-tighter mb-1 uppercase text-primary">{DISPATCH.tech.name}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-6">{DISPATCH.tech.id}</p>
              <div className="w-full p-4 bg-primary/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase opacity-40 text-primary mb-1">Clearance Level</p>
                <p className="text-2xl font-black text-primary">Level {DISPATCH.tech.level}</p>
              </div>
              <div className="mt-4 w-full p-4 bg-amber-50 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-amber-600">Est. Distance</p>
                <p className="font-black text-primary">{DISPATCH.distance} km</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STAGE 2: IN-TRANSIT MONITORING ── */}
        {stage === 'route' && (
          <motion.div key="route" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid lg:grid-cols-4 gap-8">

            {/* MAP AREA */}
            <div className="lg:col-span-3 glass-panel h-[600px] rounded-[3.5rem] relative overflow-hidden bg-slate-100 border-4 border-white">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1d3557_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Animated truck */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
                <defs>
                  <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1d3557" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#a8dadc" stopOpacity="0.8"/>
                  </linearGradient>
                </defs>
                <path d="M 120 450 Q 300 200 680 150" stroke="url(#routeLine)" strokeWidth="3" strokeDasharray="8 6" fill="none"/>
                {/* Origin dot */}
                <circle cx="120" cy="450" r="10" fill="#1d3557" opacity="0.7"/>
                <text x="135" y="455" fill="#1d3557" fontSize="10" fontWeight="bold" opacity="0.6">LONG ISLAND</text>
                {/* Destination pulsing */}
                <circle cx="680" cy="150" r="18" fill="#a8dadc" opacity="0.2"/>
                <circle cx="680" cy="150" r="10" fill="#a8dadc" opacity="0.8"/>
                <text x="695" y="155" fill="#1d3557" fontSize="10" fontWeight="bold" opacity="0.6">NEWARK</text>
              </svg>

              {/* Animated truck position (65% along path) */}
              <motion.div
                className="absolute"
                style={{ left: '52%', top: '36%' }}
                animate={{ x: [0, 8, -4, 0], y: [0, -4, 4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="bg-primary text-white p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
                  <Truck size={18} />
                  <div>
                    <p className="text-[8px] font-black uppercase leading-none">RX-882</p>
                    <p className="text-[8px] font-bold opacity-60">{Math.round(velocity)} km/h</p>
                  </div>
                </div>
              </motion.div>

              {/* Overlay cards */}
              <div className="absolute top-8 left-8 flex gap-4">
                <div className="glass-panel p-5 rounded-2xl bg-white/80">
                  <p className="text-[9px] font-black opacity-40 uppercase text-primary">Temp</p>
                  <p className="text-xl font-black text-emerald-500">-196°C</p>
                </div>
                <div className="glass-panel p-5 rounded-2xl bg-white/80">
                  <p className="text-[9px] font-black opacity-40 uppercase text-primary">G-Force</p>
                  <p className="text-xl font-black text-primary">0.02G</p>
                </div>
                <div className="glass-panel p-5 rounded-2xl bg-white/80">
                  <p className="text-[9px] font-black opacity-40 uppercase text-primary">Velocity</p>
                  <p className="text-xl font-black text-primary">{Math.round(velocity)} km/h</p>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="glass-panel p-8 rounded-[2.5rem] bg-white/80 backdrop-blur-xl">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-1 text-primary">Current Milestone</p>
                      <p className="text-2xl font-black tracking-tighter uppercase italic text-primary">
                        {eta > 600 ? 'Lincoln Tunnel Approach' : eta > 200 ? 'Entering Newark' : 'Final Mile'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black opacity-30 uppercase mb-1 text-primary">ETA</p>
                      <p className={`text-2xl font-black italic ${eta < 120 ? 'text-red-500' : 'text-primary'}`}>
                        {eta === 0 ? 'ARRIVED' : fmt(eta)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(100, 100 - (eta / (DISPATCH.eta * 60)) * 100)}%` }}
                      className="h-full bg-secondary rounded-full shadow-[0_0_15px_rgba(168,218,220,1)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <div className="glass-panel p-8 rounded-[3rem]">
                <p className="text-[10px] font-black opacity-30 uppercase mb-6 tracking-widest text-primary">Asset Stability</p>
                <div className="space-y-5">
                  {[
                    { label: 'Power Hub', value: '98%',   icon: Zap,      color: 'text-emerald-500' },
                    { label: 'Pulse Sync',value: 'LOCKED',icon: Activity, color: 'text-secondary'   },
                    { label: 'Beacon',    value: 'ACTIVE', icon: Timer,    color: 'text-primary'     },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center ${item.color}`}>
                        <item.icon size={16} />
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black opacity-40 uppercase text-primary">{item.label}</p>
                        <p className={`font-black text-sm ${item.color}`}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/logistics/incident')}
                className="w-full py-4 glass-panel rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <ShieldAlert size={14} /> Report Incident
              </button>

              <button
                onClick={() => setStage('delivery')}
                className="w-full bg-primary text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all"
              >
                Report Arrival →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STAGE 3: DELIVERY HANDOVER ── */}
        {stage === 'delivery' && (
          <motion.div key="delivery" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto w-full">
            <div className={glassStyle}>
              {finalising ? (
                <div className="text-center py-20">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <CheckCheck size={64} className="text-emerald-500 mx-auto mb-6" />
                  </motion.div>
                  <h3 className="text-3xl font-black tracking-tighter text-primary mb-2">Finalising Handover…</h3>
                  <p className="opacity-40 text-sm font-bold uppercase">Redirecting to logs registry</p>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-black tracking-tighter mb-10 text-center uppercase italic text-primary">
                    Delivery Handover Protocol
                  </h3>

                  {/* CHECKLIST */}
                  <div className="space-y-3 mb-8">
                    {CHECKLIST.map((item, i) => (
                      <label key={i} className={`flex items-center justify-between p-5 rounded-[2rem] border cursor-pointer transition-all ${checks[i] ? 'bg-emerald-50 border-emerald-200' : 'bg-white/40 border-white hover:bg-white/60'}`}>
                        <span className={`font-black text-xs uppercase tracking-tight ${checks[i] ? 'text-emerald-700' : 'text-primary/70'}`}>{item}</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg accent-emerald-600"
                          checked={!!checks[i]}
                          onChange={() => setChecks(prev => ({ ...prev, [i]: !prev[i] }))}
                        />
                      </label>
                    ))}
                  </div>

                  {/* PHOTO + SIGNATURE */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => { fileRef.current?.click(); setPhotoUploaded(true); }}
                      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all gap-3 group ${photoUploaded ? 'border-emerald-400 bg-emerald-50' : 'border-primary/10 hover:bg-white/40'}`}
                    >
                      {photoUploaded ? <CheckCircle2 className="text-emerald-500" /> : <Camera className="text-secondary group-hover:scale-110 transition-all" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${photoUploaded ? 'text-emerald-600' : 'text-primary'}`}>
                        {photoUploaded ? 'Photo Uploaded' : 'Asset Photo Proof'}
                      </span>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" />

                    <div className="p-6 bg-white/60 rounded-3xl flex flex-col items-center justify-center border border-white text-center">
                      <p className="text-[10px] font-black opacity-30 uppercase mb-3 text-primary">Clinic Signature</p>
                      <input
                        type="text"
                        placeholder="Type to sign..."
                        value={signature}
                        onChange={e => setSignature(e.target.value)}
                        className="w-full text-center border-b border-primary/20 bg-transparent outline-none font-serif italic text-primary text-lg placeholder:opacity-30 pb-1"
                      />
                    </div>
                  </div>

                  {/* FINALIZE */}
                  <button
                    disabled={!allChecked || !signature.trim()}
                    onClick={handleFinalize}
                    className="w-full bg-emerald-600 disabled:bg-emerald-200 disabled:cursor-not-allowed text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                  >
                    <PackageCheck /> Finalize Delivery
                    {(!allChecked || !signature.trim()) && <span className="text-[9px] opacity-60">({!allChecked ? 'complete checklist' : 'add signature'})</span>}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}