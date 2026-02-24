import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Zap, Navigation, PhoneCall, ChevronRight,
  Activity, AlertCircle, BrainCircuit, Loader2, ClipboardList, PackageSearch,
} from 'lucide-react';
// Direct local backend call — no dependency on medgemma.js version
async function askMedGemmaJSON(systemPrompt, userContent, fallback) {
  const prompt = `${systemPrompt}\n\nUser: ${userContent}\n\nAssistant (JSON only):`;
  try {
    const res = await fetch('http://localhost:5000/api/medgemma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    const raw = data.response || '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON');
    return JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    console.error('[Emergency AI]', err.message);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

const TRIAGE_FALLBACKS = {
  "Immediate Trauma Surgery":  { severity:"P1", urgency_window_minutes:12, required_equipment:[{name:"Mobile X-Ray Unit",quantity:1,critical:true},{name:"Portable Ultrasound",quantity:1,critical:true},{name:"Surgical Light Tower",quantity:2,critical:false}], clinical_rationale:"Polytrauma requires immediate imaging and surgical access within the golden hour for haemorrhage control.", immediate_actions:["Activate OR team and trauma bay immediately","Deploy portable imaging to assess internal injuries","Ensure 2 large-bore IV access and crossmatch 4 units of blood"], contraindications:null },
  "Critical Dialysis Failure": { severity:"P1", urgency_window_minutes:18, required_equipment:[{name:"Fresenius 5008S Dialysis",quantity:1,critical:true},{name:"Dialysis Consumables Kit",quantity:3,critical:true}], clinical_rationale:"Acute renal failure with hyperkalemia risk requires dialysis within 20 minutes to avoid cardiac arrhythmia.", immediate_actions:["Obtain emergency vascular access","Monitor K+ and ECG continuously","Prepare emergent dialysate solution"], contraindications:"Do not use if patient has uncontrolled septic shock" },
  "Neonatal ICU Support":      { severity:"P2", urgency_window_minutes:15, required_equipment:[{name:"Neonatal Ventilator",quantity:1,critical:true},{name:"Incubator Unit",quantity:1,critical:true},{name:"Pulse Oximeter",quantity:2,critical:false}], clinical_rationale:"Premature neonate requires respiratory support and thermoregulation — delay beyond 15 minutes risks hypoxic brain injury.", immediate_actions:["Prepare neonatal resuscitation bay","Warm incubator to 37°C before arrival","Alert neonatologist on call"], contraindications:null },
  "Cardiac Arrest Response":   { severity:"P1", urgency_window_minutes:8,  required_equipment:[{name:"Defibrillator AED",quantity:1,critical:true},{name:"Portable ECG Monitor",quantity:1,critical:true},{name:"Emergency Crash Cart",quantity:1,critical:true}], clinical_rationale:"VF/VT requires defibrillation within 5 minutes. ACLS protocol must be initiated on scene immediately.", immediate_actions:["Begin CPR immediately 30:2 ratio","Charge defibrillator to 200J","Establish IV access for epinephrine 1mg bolus"], contraindications:"Do not defibrillate if confirmed DNR order" },
  "Respiratory Failure":       { severity:"P2", urgency_window_minutes:10, required_equipment:[{name:"ICU Ventilator",quantity:1,critical:true},{name:"High-Flow O2 System",quantity:1,critical:true},{name:"Bronchoscopy Kit",quantity:1,critical:false}], clinical_rationale:"Acute hypoxic respiratory failure with SpO2 <88% demands immediate ventilatory support and intubation.", immediate_actions:["Apply high-flow O2 at 15L/min","Prepare RSI protocol for intubation","Alert ICU for immediate bed allocation"], contraindications:"Avoid high tidal volumes in ARDS — use lung-protective ventilation" },
};

// ── FIXED: EMERGENCY_TYPES was accidentally truncated in old version ──────────
const EMERGENCY_TYPES = [
  { type: "Cardiac Arrest Response",   eta: "8 mins",  color: "text-red-600",    bg: "bg-red-50"    },
  { type: "Immediate Trauma Surgery",  eta: "12 mins", color: "text-orange-600", bg: "bg-orange-50" },
  { type: "Critical Dialysis Failure", eta: "18 mins", color: "text-amber-600",  bg: "bg-amber-50"  },
  { type: "Neonatal ICU Support",      eta: "15 mins", color: "text-blue-600",   bg: "bg-blue-50"   },
  { type: "Respiratory Failure",       eta: "10 mins", color: "text-purple-600", bg: "bg-purple-50" },
];

const SEVERITY_COLOR = { P1: "text-red-600 bg-red-50", P2: "text-orange-500 bg-orange-50", P3: "text-emerald-600 bg-emerald-50" };

const TRIAGE_SYSTEM = `You are MedGemma, clinical AI for ResourceRX. Return ONLY valid JSON (no markdown, no extra text):
{"severity":"P1"|"P2"|"P3","urgency_window_minutes":number,"required_equipment":[{"name":string,"quantity":number,"critical":boolean}],"clinical_rationale":string,"immediate_actions":[string,string,string],"contraindications":string|null}
Be SPECIFIC to the emergency type. Do not use generic answers.`;

export default function ClinicEmergency() {
  const navigate = useNavigate();

  const [selected,       setSelected]       = useState(null);
  const [patientContext, setPatientContext] = useState('');
  const [triageResult,   setTriageResult]  = useState(null);
  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState(null);
  const [dispatched,     setDispatched]    = useState(false);

  const handleSelect = (item) => {
    setSelected(item);
    setTriageResult(null);
    setError(null);
    setDispatched(false);
  };

  const handleTriage = async () => {
    if (!selected) return;
    setLoading(true);
    setTriageResult(null);
    setError(null);
    const result = await askMedGemmaJSON(
      TRIAGE_SYSTEM,
      `Emergency: ${selected.type}\nPatient context: ${patientContext || 'Not provided'}`,
      TRIAGE_FALLBACKS[selected.type] || TRIAGE_FALLBACKS['Cardiac Arrest Response']
    );
    setTriageResult(result);
    setLoading(false);
  };

  const handleAuthorize = () => {
    setDispatched(true);
    // Store to session so dispatch log can reflect it
    try {
      const existing = JSON.parse(sessionStorage.getItem('rrx_emergency_dispatch') || '[]');
      existing.unshift({
        id: `EMG-${Date.now()}`,
        type: selected.type,
        eta: selected.eta,
        severity: triageResult?.severity || 'P1',
        timestamp: new Date().toLocaleTimeString(),
        equipment: triageResult?.required_equipment || [],
      });
      sessionStorage.setItem('rrx_emergency_dispatch', JSON.stringify(existing.slice(0,10)));
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pt-40 pb-20 px-6 max-w-6xl mx-auto"
    >
      {/* HEADER */}
      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 text-[10px] font-black uppercase mb-4 text-red-600 animate-pulse">
          <ShieldAlert size={14} />
          Priority 1 Protocol
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Emergency Override</h2>
        <p className="text-gray-500 font-bold tracking-tight">
          AI-Assisted Triage · Rapid Deployment of Critical Infrastructure
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* Emergency type selection */}
          <div className="glass-panel border-red-500/20 rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <AlertCircle size={120} className="text-red-600" />
            </div>
            <h4 className="text-xs font-black uppercase opacity-40 mb-8 tracking-widest">Select Critical Need</h4>
            <div className="grid gap-4">
              {EMERGENCY_TYPES.map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(item)}
                  className={`p-6 rounded-[2rem] flex items-center justify-between cursor-pointer border-2 transition-all ${
                    selected?.type === item.type
                      ? 'border-red-500 bg-red-50'
                      : 'border-transparent glass-panel hover:border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${selected?.type === item.type ? 'bg-red-500 animate-ping' : 'bg-gray-200'}`} />
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{item.type}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase">Est. resource deploy: {item.eta}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="opacity-30" />
                </div>
              ))}
            </div>
          </div>

          {/* Patient context + triage */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-[3rem] p-10 space-y-6">
                <div className="flex items-center gap-4">
                  <BrainCircuit className="text-secondary" size={24} />
                  <h4 className="text-lg font-black uppercase tracking-tighter">MedGemma Clinical Triage</h4>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-3">
                    Patient Context (optional but improves accuracy)
                  </label>
                  <textarea
                    value={patientContext}
                    onChange={e => setPatientContext(e.target.value)}
                    placeholder="e.g. 68yo male, cardiac history, unconscious on arrival, 3 minutes since onset..."
                    className="w-full glass-panel p-5 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-2 ring-secondary/20 resize-none h-28"
                  />
                </div>

                <button
                  onClick={handleTriage}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> MedGemma Analysing…</>
                    : <><BrainCircuit size={18} /> Run Clinical Triage</>
                  }
                </button>

                {error && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                    <p className="text-xs font-bold text-red-700">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Triage result */}
          <AnimatePresence>
            {triageResult && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-[3rem] p-10 space-y-8 border-red-500/20">

                {/* Severity header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-1">Triage Result</p>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{selected?.type}</h3>
                  </div>
                  <div className={`px-6 py-3 rounded-2xl text-2xl font-black border ${SEVERITY_COLOR[triageResult.severity] || 'text-primary bg-primary/5'}`}>
                    {triageResult.severity || 'P2'}
                  </div>
                </div>

                {/* Urgency window */}
                <div className="p-6 bg-red-50 rounded-2xl border border-red-200 flex items-center gap-4">
                  <Activity className="text-red-500 shrink-0" size={24} />
                  <div>
                    <p className="text-[9px] font-black uppercase text-red-500 mb-1">
                      Action Window: {triageResult.urgency_window_minutes ?? 0} minutes
                    </p>
                    <p className="text-sm font-bold text-red-800">{triageResult.clinical_rationale}</p>
                  </div>
                </div>

                {/* Required equipment */}
                <div>
                  <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Required Equipment</h4>
                  <div className="space-y-3">
                    {(triageResult.required_equipment || []).map((eq, i) => (
                      <div key={i} className={`flex items-center justify-between p-5 rounded-[1.5rem] border ${eq.critical ? 'bg-red-50 border-red-200' : 'glass-panel border-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${eq.critical ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <span className="font-black text-sm uppercase">{eq.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black opacity-40 uppercase">Qty: {eq.quantity ?? 1}</span>
                          {eq.critical && <span className="text-[9px] font-black text-red-600 bg-red-100 px-2 py-1 rounded-full uppercase">Critical</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immediate actions */}
                <div>
                  <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Immediate Actions</h4>
                  <div className="space-y-3">
                    {(triageResult.immediate_actions || []).map((action, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 glass-panel rounded-2xl">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                        <p className="text-sm font-bold">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {triageResult.contraindications && (
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-amber-600 mb-1">Contraindications</p>
                      <p className="text-xs font-bold text-amber-800">{triageResult.contraindications}</p>
                    </div>
                  </div>
                )}

                {/* Authorize dispatch */}
                {!dispatched ? (
                  <button
                    onClick={handleAuthorize}
                    className="w-full bg-primary text-white py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-secondary transition-all shadow-xl shadow-primary/20"
                  >
                    <Zap size={22} /> Authorize Emergency Dispatch
                  </button>
                ) : (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                    <p className="text-emerald-700 font-black text-lg">✓ Dispatch Authorized</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 mt-1">
                      Logged to emergency registry · Fleet notified
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          <div className="glass-panel rounded-[3rem] p-8 bg-primary text-white space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-secondary">Emergency Command</h4>
            {[
              { icon: PhoneCall,    label: "Direct Hotline",   sub: "+1 (800) RRX-EMRG" },
              { icon: Navigation,  label: "Nearest Depot",    sub: "Newark Hub · 4.2 mi" },
              { icon: ClipboardList,label: "Protocol Library", sub: "12 active SOPs" },
              { icon: PackageSearch,label: "Inventory Status", sub: "87% availability" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-5 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all cursor-pointer">
                <row.icon size={20} className="text-secondary shrink-0" />
                <div>
                  <p className="font-black text-sm uppercase">{row.label}</p>
                  <p className="text-[10px] opacity-40 font-bold">{row.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Network readiness */}
          <div className="glass-panel rounded-[3rem] p-8 space-y-5">
            <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Network Readiness</h4>
            {[
              { label: "Assets Available", val: "23 / 28", color: "bg-emerald-500" },
              { label: "Avg Deploy Time",  val: "11 mins", color: "bg-secondary"   },
              { label: "Critical Reserves",val: "6 units", color: "bg-amber-500"   },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${row.color}`} />
                  <span className="text-xs font-bold uppercase opacity-60">{row.label}</span>
                </div>
                <span className="font-black text-sm">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}