import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, Star, MapPin, ChevronRight, Activity,
  ShieldCheck, Gauge, BrainCircuit, Loader2, Sparkles, X
} from 'lucide-react';

const GLOBAL_INVENTORY = [
  { id: 1,  name: "Siemens Magnetom Vida 3T",         type: "MRI",           location: "Berlin, DE",    price: 450, rating: 4.9, specs: ["BioMatrix Tech", "70cm Bore", "Eco-Power Mode"],           reliability: "99.2%" },
  { id: 2,  name: "GE Revolution CT 512-Slice",        type: "CT Scanner",    location: "Rochester, US", price: 320, rating: 4.8, specs: ["Spectral Imaging", "0.23mm Spatial Res", "Low Dose"],       reliability: "98.5%" },
  { id: 3,  name: "Fresenius 5008S CorDiax",           type: "Dialysis",      location: "London, UK",    price: 180, rating: 5.0, specs: ["AutoSub Plus", "VAM Protection", "HDF-Ready"],              reliability: "99.9%" },
  { id: 4,  name: "Philips Ingenia Elition 3.0T",      type: "MRI",           location: "Singapore, SG", price: 550, rating: 4.7, specs: ["Compressed SENSE", "Ambient Experience", "3.0T Field"],    reliability: "97.8%" },
  { id: 5,  name: "Canon Aquilion ONE GENESIS",        type: "CT Scanner",    location: "Tokyo, JP",     price: 290, rating: 4.9, specs: ["AI Reconstruction", "Wide Detector", "Fast Scan"],          reliability: "99.0%" },
  { id: 6,  name: "Baxter Artis Physio",               type: "Dialysis",      location: "Toronto, CA",   price: 165, rating: 4.6, specs: ["Diascan Tech", "Hemocontrol", "Online HDF"],                reliability: "98.2%" },
  { id: 7,  name: "Intuitive Da Vinci Xi",             type: "Surgical Robot",location: "Paris, FR",     price: 850, rating: 4.9, specs: ["4-Arm System", "3D-HD Vision", "Firefly Tech"],             reliability: "96.5%" },
  { id: 8,  name: "Hitachi Oasis 1.2T Open",           type: "MRI",           location: "New York, US",  price: 400, rating: 4.5, specs: ["High-Field Open", "Patient Comfort", "Vertical Field"],    reliability: "97.0%" },
  { id: 9,  name: "Siemens Somatom Force",             type: "CT Scanner",    location: "Munich, DE",    price: 380, rating: 4.9, specs: ["Dual Source", "High-Speed", "Kidney Friendly"],            reliability: "99.4%" },
  { id: 10, name: "Gambro AK 98",                      type: "Dialysis",      location: "Sydney, AU",    price: 155, rating: 4.7, specs: ["Ultra-Pure Water", "User-Friendly", "Compact"],            reliability: "98.8%" },
  { id: 11, name: "Dräger Evita Infinity V500",        type: "Ventilator",    location: "Hamburg, DE",   price: 220, rating: 4.8, specs: ["NIV Mode", "SmartCare/PS", "Neonatal-ready"],              reliability: "99.1%" },
  { id: 12, name: "Getinge Servo-u Universal",         type: "Ventilator",    location: "Stockholm, SE", price: 195, rating: 4.7, specs: ["All patient sizes", "NAVA mode", "Lung protection"],       reliability: "98.7%" },
  { id: 13, name: "Philips HeartStart MRx",            type: "Defibrillator", location: "Amsterdam, NL", price: 95,  rating: 4.9, specs: ["12-lead ECG", "AED mode", "CPR guidance"],                reliability: "99.8%" },
  { id: 14, name: "GE Carescape B850",                 type: "Patient Monitor",location: "Chicago, US",  price: 130, rating: 4.8, specs: ["Multi-parameter", "EEG module", "ICU-ready"],             reliability: "99.3%" },
];

// ─── MedGemma equipment mapper (local Ollama via Express backend) ─────────────
// Keyword → equipment type mapping for fallback
const KEYWORD_MAP = [
  { words:['respiratory','breathing','ventilat','hypoxia','oxygen','intubat','ards','lung','icu','breath'],  types:['Ventilator'] },
  { words:['cardiac','heart','arrest','defibril','ecg','arrhythmia','chest pain'],                           types:['Defibrillator','Patient Monitor'] },
  { words:['dialysis','renal','kidney','creatinine','hyperkalaemia','hyperkalemia'],                          types:['Dialysis'] },
  { words:['mri','magnetic','neuro','brain','spine','tumour','tumor','musculoskeletal'],                      types:['MRI'] },
  { words:['ct','computed','cancer','trauma','abdom','pelvis','chest','radiology','scan'],                    types:['CT Scanner'] },
  { words:['surgery','surgical','robot','laparoscop','prostate','colorectal'],                               types:['Surgical Robot'] },
  { words:['monitor','vitals','icu','critical','pressure','spo2','saturation'],                              types:['Patient Monitor'] },
];

function keywordFallback(text) {
  const lower = text.toLowerCase();
  const matched = new Set();
  KEYWORD_MAP.forEach(({words, types}) => {
    if (words.some(w => lower.includes(w))) types.forEach(t => matched.add(t));
  });
  return [...matched];
}

async function runClinicalQuery(clinicalDescription) {
  // Simple prompt — gemma:2b handles this better than complex schema
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
      // Validate equipment_types — if empty or wrong, use keyword fallback
      if (!parsed.equipment_types?.length) {
        parsed.equipment_types = keywordFallback(clinicalDescription);
      }
      if (!parsed.summary) parsed.summary = clinicalDescription;
      if (!parsed.urgency) parsed.urgency = 'urgent';
      return parsed;
    }
  } catch {}

  // Full fallback — keyword-only, no AI
  const types = keywordFallback(clinicalDescription);
  return {
    summary: clinicalDescription,
    equipment_types: types.length ? types : ['Patient Monitor'],
    urgency: 'urgent',
    clinical_notes: `Based on clinical keywords: ${clinicalDescription}`,
    quantity_guidance: `${types.length || 1} unit(s) recommended`,
  };
}
// ─────────────────────────────────────────────────────────────────────────────

const URGENCY_STYLE = {
  immediate: "bg-red-50 text-red-600 border-red-200",
  urgent:    "bg-orange-50 text-orange-600 border-orange-200",
  routine:   "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function ClinicSearch() {
  const [searchTerm, setSearchTerm]           = useState("");
  const [clinicalQuery, setClinicalQuery]     = useState("");
  const [aiResult, setAiResult]               = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [activeTypes, setActiveTypes]         = useState([]);

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
      setSearchTerm(""); // clear manual search when AI takes over
    } catch (e) {
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

  // Filter: AI types take priority over text search
  const filteredItems = GLOBAL_INVENTORY.filter(item => {
    if (activeTypes.length > 0) {
      return activeTypes.some(t => item.type.toLowerCase().includes(t.toLowerCase()));
    }
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-40 pb-20 px-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4">
          <Zap size={14} className="text-secondary" />
          Global Asset Registry
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-8">Infrastructure Catalog</h2>

        {/* ── AI Clinical Query Bar ── */}
        <div className="max-w-3xl space-y-4 mb-6">
          <div className="relative">
            <BrainCircuit className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/60" size={20} />
            <input
              type="text"
              placeholder='Describe your clinical need (e.g. "3 ICU patients needing respiratory support post-COVID")'
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

          {/* Or manual search */}
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
            <input
              type="text"
              placeholder="Or search by model name (Siemens, MRI, Da Vinci...)"
              className="w-full glass-panel py-4 pl-14 pr-8 rounded-[1.5rem] font-bold outline-none focus:ring-2 ring-secondary/10 transition-all text-sm"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setActiveTypes([]); setAiResult(null); }}
            />
          </div>
        </div>

        {/* ── MedGemma Result Banner ── */}
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
                <span className="text-[9px] font-black bg-secondary text-white px-2 py-0.5 rounded-full uppercase">
                  MedGemma · HAI-DEF
                </span>
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
                  <span key={type} className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                    {type}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-xs text-red-500 font-bold mt-3 max-w-3xl">{error}</p>}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">

        {/* SIDEBAR FILTERS */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="glass-panel p-8 rounded-[2.5rem] sticky top-32 space-y-8">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Modality</h4>
              <div className="space-y-4 font-bold text-sm">
                {["All Systems", "Imaging", "Renal", "Respiratory", "Robotics", "Monitoring"].map(cat => (
                  <p key={cat} className="hover:text-secondary cursor-pointer transition-colors flex items-center justify-between">
                    {cat} <ChevronRight size={14} />
                  </p>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-primary/5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Verification</h4>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 p-2 rounded-xl">
                <ShieldCheck size={14} /> HIPAA COMPLIANT ASSETS
              </div>
            </div>
            {aiResult && (
              <div className="pt-6 border-t border-secondary/10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-secondary">AI Filter Active</h4>
                <p className="text-[10px] font-bold opacity-60">Showing {filteredItems.length} AI-matched results</p>
                <button onClick={clearAI} className="mt-3 text-[10px] font-black text-red-500 hover:underline">
                  Clear AI Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MACHINE CARDS */}
        <div className="lg:col-span-3 space-y-6">
          {filteredItems.length === 0 && (
            <div className="text-center py-20 opacity-40">
              <p className="font-black text-xl">No matching equipment found</p>
              <p className="text-sm mt-2">Try a different clinical description</p>
            </div>
          )}
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-panel p-10 rounded-[3.5rem] flex flex-col xl:flex-row gap-10 hover:shadow-2xl hover:shadow-secondary/10 transition-all group">
              <div className="w-full xl:w-64 h-48 bg-primary/5 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                <Activity className="text-secondary opacity-20 absolute top-4 right-4" size={24} />
                {/* AI match badge */}
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
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black bg-secondary text-white px-3 py-1 rounded-full uppercase">Verified</span>
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={12} /> {item.location}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">{item.name}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.specs.map(spec => (
                    <div key={spec} className="flex items-center gap-2 text-[11px] font-bold opacity-60">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" /> {spec}
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

              <div className="xl:w-48 flex flex-col justify-between items-end border-l border-primary/5 pl-8">
                <div className="text-right">
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Starting at</p>
                  <p className="text-4xl font-black tracking-tighter">${item.price}<span className="text-sm">/hr</span></p>
                </div>
                <button className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary transition-all active:scale-95 shadow-xl">
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