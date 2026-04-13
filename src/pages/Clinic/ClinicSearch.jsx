import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Zap, Star, MapPin, ChevronRight, Activity,
  ShieldCheck, Gauge, BrainCircuit, Loader2, Sparkles, X
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

// ─── Curated, realistic medical equipment inventory ───────────────────────────
// Prices in INR/hr based on Indian market rates (NOT direct USD conversion)
// MRI: ₹3,000–₹8,000/hr | CT: ₹2,000–₹5,000/hr | Dialysis: ₹1,200–₹2,500/hr
// Ventilator: ₹1,500–₹3,000/hr | Defib: ₹800–₹1,500/hr | Surgical Robot: ₹60,000–₹1,20,000/hr
const GLOBAL_INVENTORY = [
  // ── MRI ──────────────────────────────────────────────────────────────────
  {
    id: 1, name: "Siemens Magnetom Vida 3T", type: "MRI",
    location: "Mumbai, IN", price: 6500, rating: 4.9,
    specs: ["BioMatrix Technology", "70cm Wide Bore", "Eco-Power Mode"],
    reliability: "99.2%",
  },
  {
    id: 2, name: "Philips Ingenia Elition 3.0T", type: "MRI",
    location: "Delhi, IN", price: 7200, rating: 4.8,
    specs: ["Compressed SENSE", "dStream Architecture", "Ambient Experience"],
    reliability: "98.5%",
  },
  {
    id: 3, name: "GE SIGNA Artist 1.5T", type: "MRI",
    location: "Bengaluru, IN", price: 4800, rating: 4.7,
    specs: ["AIR Technology", "Quiet Suite", "Wide Bore 70cm"],
    reliability: "97.8%",
  },
  {
    id: 4, name: "Siemens Magnetom Altea 1.5T", type: "MRI",
    location: "Chennai, IN", price: 5200, rating: 4.8,
    specs: ["XR 80 Gradients", "BioMatrix Sensors", "Tim 4G System"],
    reliability: "98.1%",
  },
  // ── CT Scanner ───────────────────────────────────────────────────────────
  {
    id: 5, name: "GE Revolution CT 512-Slice", type: "CT Scanner",
    location: "Pune, IN", price: 4500, rating: 4.9,
    specs: ["Spectral Imaging", "0.23mm Spatial Res", "SnapShot Freeze"],
    reliability: "99.0%",
  },
  {
    id: 6, name: "Siemens Somatom Force (Dual Source)", type: "CT Scanner",
    location: "Hyderabad, IN", price: 5200, rating: 4.9,
    specs: ["Dual Source 2×100kW", "CARE Dose4D", "Kidney Friendly AI"],
    reliability: "99.4%",
  },
  {
    id: 7, name: "Canon Aquilion ONE GENESIS 320-Slice", type: "CT Scanner",
    location: "Kolkata, IN", price: 4200, rating: 4.8,
    specs: ["320-Row Detector", "AI Reconstruction", "Dose Reduction"],
    reliability: "98.7%",
  },
  {
    id: 8, name: "Philips Incisive CT 128-Slice", type: "CT Scanner",
    location: "Ahmedabad, IN", price: 3600, rating: 4.7,
    specs: ["iDose4 Reconstruction", "LoopX Robotic", "Spectral CT Ready"],
    reliability: "97.5%",
  },
  // ── Dialysis ─────────────────────────────────────────────────────────────
  {
    id: 9, name: "Fresenius 5008S CorDiax", type: "Dialysis",
    location: "Chennai, IN", price: 2200, rating: 5.0,
    specs: ["AutoSub Plus", "VAM Fluid Protection", "HDF-Ready Online"],
    reliability: "99.9%",
  },
  {
    id: 10, name: "Baxter Toray BK-F Series", type: "Dialysis",
    location: "Jaipur, IN", price: 1800, rating: 4.7,
    specs: ["Vitamin E Membrane", "High Flux Filter", "Biocompatible"],
    reliability: "98.4%",
  },
  {
    id: 11, name: "Nipro SURDIAL-X", type: "Dialysis",
    location: "Kochi, IN", price: 1600, rating: 4.6,
    specs: ["Online HDF", "Hemocontrol", "Blood Volume Monitor"],
    reliability: "97.9%",
  },
  // ── Ventilator ───────────────────────────────────────────────────────────
  {
    id: 12, name: "Dräger Evita Infinity V500", type: "Ventilator",
    location: "Delhi, IN", price: 2800, rating: 4.8,
    specs: ["NIV Mode", "SmartCare/PS", "Neonatal-Adult Range"],
    reliability: "99.1%",
  },
  {
    id: 13, name: "Getinge Servo-u Universal", type: "Ventilator",
    location: "Bengaluru, IN", price: 2600, rating: 4.8,
    specs: ["All Patient Sizes", "NAVA Mode", "Lung-Protective"],
    reliability: "98.7%",
  },
  {
    id: 14, name: "Hamilton-G5 ICU Ventilator", type: "Ventilator",
    location: "Mumbai, IN", price: 3000, rating: 4.9,
    specs: ["INTELLiVENT-ASV", "Adaptive Support", "Spontaneous Modes"],
    reliability: "99.3%",
  },
  // ── Defibrillator ────────────────────────────────────────────────────────
  {
    id: 15, name: "Philips HeartStart MRx M3536A", type: "Defibrillator",
    location: "Chandigarh, IN", price: 1200, rating: 4.9,
    specs: ["12-Lead ECG", "AED Mode", "CPR Guidance"],
    reliability: "99.8%",
  },
  {
    id: 16, name: "Zoll R Series ALS", type: "Defibrillator",
    location: "Pune, IN", price: 1400, rating: 4.8,
    specs: ["Real CPR Help", "Pacing Capable", "Bluetooth Sync"],
    reliability: "99.5%",
  },
  {
    id: 17, name: "Nihon Kohden TEC-5600 Series", type: "Defibrillator",
    location: "Hyderabad, IN", price: 1100, rating: 4.7,
    specs: ["Biphasic Waveform", "Auto-charging", "Compact Portable"],
    reliability: "98.9%",
  },
  // ── Surgical Robot ───────────────────────────────────────────────────────
  {
    id: 18, name: "Intuitive Da Vinci Xi System", type: "Surgical Robot",
    location: "Mumbai, IN", price: 85000, rating: 4.9,
    specs: ["4-Arm System", "3D-HD Vision", "Firefly Fluorescence"],
    reliability: "96.5%",
  },
  {
    id: 19, name: "CMR Surgical Versius", type: "Surgical Robot",
    location: "Chennai, IN", price: 72000, rating: 4.7,
    specs: ["Modular Arms", "3D Laparoscopic Vision", "Compact Design"],
    reliability: "95.8%",
  },
  // ── Patient Monitor ──────────────────────────────────────────────────────
  {
    id: 20, name: "Philips IntelliVue MX800", type: "Patient Monitor",
    location: "Bengaluru, IN", price: 1500, rating: 4.8,
    specs: ["Wireless Telemetry", "ICU Ready", "EEG Module"],
    reliability: "99.3%",
  },
  {
    id: 21, name: "GE Carescape B850", type: "Patient Monitor",
    location: "Delhi, IN", price: 1800, rating: 4.8,
    specs: ["Multi-parameter", "Ventilator Integration", "Alarm Management"],
    reliability: "98.8%",
  },
  {
    id: 22, name: "Mindray BeneVision N22", type: "Patient Monitor",
    location: "Kolkata, IN", price: 1200, rating: 4.7,
    specs: ["18.5\" Touchscreen", "Remote View", "BIS/EEG Ready"],
    reliability: "98.2%",
  },
];

// ── Keyword fallback for AI ───────────────────────────────────────────────────
const KEYWORD_MAP = [
  { words: ['respiratory','breathing','ventilat','hypoxia','oxygen','intubat','ards','lung','icu','breath'], types: ['Ventilator'] },
  { words: ['cardiac','heart','arrest','defibril','ecg','arrhythmia','chest pain'], types: ['Defibrillator','Patient Monitor'] },
  { words: ['dialysis','renal','kidney','creatinine','hyperkalaemia','hyperkalemia'], types: ['Dialysis'] },
  { words: ['mri','magnetic','neuro','brain','spine','tumour','tumor','musculoskeletal'], types: ['MRI'] },
  { words: ['ct','computed','cancer','trauma','abdom','pelvis','chest','radiology','scan'], types: ['CT Scanner'] },
  { words: ['surgery','surgical','robot','laparoscop','prostate','colorectal'], types: ['Surgical Robot'] },
  { words: ['monitor','vitals','icu','critical','pressure','spo2','saturation'], types: ['Patient Monitor'] },
];

function keywordFallback(text) {
  const lower = text.toLowerCase();
  const matched = new Set();
  KEYWORD_MAP.forEach(({ words, types }) => {
    if (words.some(w => lower.includes(w))) types.forEach(t => matched.add(t));
  });
  return [...matched];
}

async function runClinicalQuery(clinicalDescription) {
  const prompt = `Medical equipment AI. Given: "${clinicalDescription}"
List ONLY the equipment types needed. Choose from: MRI, CT Scanner, Dialysis, Ventilator, Defibrillator, Surgical Robot, Patient Monitor.
Reply with just a JSON object like this example: {"summary":"brief summary","equipment_types":["Ventilator","Patient Monitor"],"urgency":"immediate","clinical_notes":"reason","quantity_guidance":"3 units needed"}
JSON:`;

  try {
    const res = await fetch("http://localhost:5000/api/medgemma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    const raw = data.response || "";
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!parsed.equipment_types?.length) parsed.equipment_types = keywordFallback(clinicalDescription);
      if (!parsed.summary) parsed.summary = clinicalDescription;
      if (!parsed.urgency) parsed.urgency = 'urgent';
      return parsed;
    }
  } catch {}

  const types = keywordFallback(clinicalDescription);
  return {
    summary: clinicalDescription,
    equipment_types: types.length ? types : ['Patient Monitor'],
    urgency: 'urgent',
    clinical_notes: `Based on clinical keywords: ${clinicalDescription}`,
    quantity_guidance: `${types.length || 1} unit(s) recommended`,
  };
}

const URGENCY_STYLE = {
  immediate: "bg-red-50 text-red-600 border-red-200",
  urgent:    "bg-orange-50 text-orange-600 border-orange-200",
  routine:   "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function ClinicSearch() {
  const navigate = useNavigate();
  const { startBooking } = useClinic();

  const [searchTerm,    setSearchTerm]    = useState("");
  const [clinicalQuery, setClinicalQuery] = useState("");
  const [aiResult,      setAiResult]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [activeTypes,   setActiveTypes]   = useState([]);

  const handleAISearch = async () => {
    if (!clinicalQuery.trim()) return;
    setLoading(true);
    setAiResult(null);
    setError(null);
    setActiveTypes([]);
    try {
      const result = await runClinicalQuery(clinicalQuery);
      setAiResult(result);
      setActiveTypes(result.equipment_types || []);
      setSearchTerm("");
    } catch {
      setError("AI query failed — is the backend running? (node index.js on port 5000)");
    } finally {
      setLoading(false);
    }
  };

  const clearAI = () => {
    setAiResult(null);
    setActiveTypes([]);
    setError(null);
    setClinicalQuery("");
  };

  const filteredItems = GLOBAL_INVENTORY.filter(item => {
    if (activeTypes.length > 0) {
      return activeTypes.some(t => item.type.toLowerCase().includes(t.toLowerCase()));
    }
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-40 pb-20 px-6 max-w-7xl mx-auto">

      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4">
          <Zap size={14} className="text-secondary" /> Global Asset Registry
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-4">Infrastructure Catalog</h2>
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase text-emerald-700 border border-emerald-500/20">
            ✓ Curated · {GLOBAL_INVENTORY.length} verified devices · INR pricing
          </span>
        </div>

        {/* AI Clinical Query Bar */}
        <div className="max-w-3xl space-y-4 mb-6">
          <div className="relative">
            <BrainCircuit className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/60" size={20} />
            <input
              type="text"
              placeholder='Describe your clinical need (e.g. "3 ICU patients needing respiratory support")'
              className="w-full glass-panel py-6 pl-16 pr-36 rounded-[2rem] font-medium outline-none focus:ring-2 ring-secondary/20 transition-all text-sm"
              value={clinicalQuery}
              onChange={e => setClinicalQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAISearch()}
            />
            <button
              onClick={handleAISearch}
              disabled={loading || !clinicalQuery.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-secondary text-white px-5 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? "Analyzing..." : "AI Match"}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
            <input
              type="text"
              placeholder="Or search by model name, type, or city…"
              className="w-full glass-panel py-4 pl-14 pr-8 rounded-[1.5rem] font-bold outline-none focus:ring-2 ring-secondary/10 transition-all text-sm"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setActiveTypes([]); setAiResult(null); }}
            />
          </div>
        </div>

        <AnimatePresence>
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl glass-panel rounded-[2rem] p-6 border border-secondary/20 space-y-3 relative"
            >
              <button onClick={clearAI} className="absolute top-4 right-4 opacity-40 hover:opacity-100">
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[9px] font-black bg-secondary text-white px-2 py-0.5 rounded-full uppercase">MedGemma</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${URGENCY_STYLE[aiResult.urgency] || ""}`}>
                  {aiResult.urgency}
                </span>
              </div>
              <p className="text-sm font-bold">{aiResult.summary}</p>
              <p className="text-xs text-gray-500">{aiResult.clinical_notes}</p>
              {aiResult.quantity_guidance && (
                <p className="text-[10px] font-black text-secondary/80 uppercase">{aiResult.quantity_guidance}</p>
              )}
              <div className="flex gap-2 flex-wrap pt-1">
                {aiResult.equipment_types?.map(type => (
                  <span key={type} className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">{type}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="text-xs text-red-500 font-bold mt-3 max-w-3xl">{error}</p>}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">

        {/* Sidebar filters */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="glass-panel p-8 rounded-[2.5rem] sticky top-32 space-y-8">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Modality</h4>
              <div className="space-y-3 font-bold text-sm">
                {["All Systems", "MRI", "CT Scanner", "Dialysis", "Ventilator", "Defibrillator", "Surgical Robot", "Patient Monitor"].map(cat => (
                  <p key={cat}
                    onClick={() => {
                      if (cat === "All Systems") { setActiveTypes([]); setAiResult(null); }
                      else { setActiveTypes([cat]); setAiResult(null); setSearchTerm(""); }
                    }}
                    className={`hover:text-secondary cursor-pointer transition-colors flex items-center justify-between ${activeTypes[0] === cat ? 'text-secondary font-black' : ''}`}>
                    {cat} <ChevronRight size={14} />
                  </p>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-primary/5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Pricing</h4>
              <p className="text-[10px] font-bold opacity-60 leading-relaxed">
                All prices in <strong>₹ INR/hr</strong> — Indian market rates, not dollar conversions.
              </p>
            </div>
            <div className="pt-4 border-t border-primary/5">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 p-2 rounded-xl">
                <ShieldCheck size={14} /> HIPAA Compliant
              </div>
            </div>
            {aiResult && (
              <div className="pt-4 border-t border-secondary/10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-secondary">AI Filter Active</h4>
                <p className="text-[10px] font-bold opacity-60">{filteredItems.length} AI-matched results</p>
                <button onClick={clearAI} className="mt-3 text-[10px] font-black text-red-500 hover:underline">Clear AI Filter</button>
              </div>
            )}
          </div>
        </div>

        {/* Equipment cards */}
        <div className="lg:col-span-3 space-y-6">
          {filteredItems.length === 0 && (
            <div className="text-center py-20 opacity-40">
              <p className="font-black text-xl">No matching equipment found</p>
              <p className="text-sm mt-2">Try a different search</p>
            </div>
          )}
          {filteredItems.map(item => (
            <div key={item.id} className="glass-panel p-10 rounded-[3.5rem] flex flex-col xl:flex-row gap-10 hover:shadow-2xl hover:shadow-secondary/10 transition-all group">
              <div className="w-full xl:w-64 h-48 bg-primary/5 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                <Activity className="text-secondary opacity-20 absolute top-4 right-4" size={24} />
                {activeTypes.length > 0 && activeTypes.some(t => item.type.toLowerCase().includes(t.toLowerCase())) && (
                  <div className="absolute top-3 left-3 bg-secondary text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={8} /> AI Match
                  </div>
                )}
                <div className="text-secondary font-black text-xs uppercase tracking-widest mb-2">{item.type}</div>
                <Zap size={48} className="text-secondary group-hover:scale-110 transition-transform" />
              </div>

              <div className="flex-1 space-y-6 text-left">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[10px] font-black bg-secondary text-white px-3 py-1 rounded-full uppercase">Verified</span>
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={12} /> {item.location}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter">{item.name}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.specs.map(spec => (
                    <div key={spec} className="flex items-center gap-2 text-[11px] font-bold opacity-60">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" /> {spec}
                    </div>
                  ))}
                </div>
                <div className="flex gap-6 pt-2">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Gauge size={14} className="text-secondary" />
                    <span>Reliability: <span className="text-emerald-600">{item.reliability}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span>{item.rating} <span className="opacity-40">(120+ Uses)</span></span>
                  </div>
                </div>
              </div>

              <div className="xl:w-52 flex flex-col justify-between items-end border-l border-primary/5 pl-8">
                <div className="text-right">
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Starting at</p>
                  <p className="text-3xl font-black tracking-tighter">
                    ₹{item.price.toLocaleString('en-IN')}
                    <span className="text-sm font-bold opacity-50">/hr</span>
                  </p>
                  <p className="text-[9px] font-bold opacity-30 mt-1">Indian market rate</p>
                </div>
                <button
                  onClick={() => { startBooking(item); navigate('/clinic/booking'); }}
                  className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary transition-all active:scale-95 shadow-xl mt-4">
                  Quick Book <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}