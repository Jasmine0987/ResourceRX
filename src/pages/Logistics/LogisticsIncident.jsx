// Inline local AI helper — calls Express backend → Ollama (no API key needed)
async function askMedGemmaJSON(systemPrompt, userContent, fallback) {
  const prompt = `${systemPrompt}

User: ${userContent}

Assistant (JSON only):`;
  try {
    const res = await fetch('http://localhost:5000/api/medgemma', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    const raw = data.response || '';
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON');
    return JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    console.error('[AI Local]', err.message);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}
async function askMedGemmaText(systemPrompt, userContent, fallback) {
  const prompt = `${systemPrompt}

User: ${userContent}

Assistant:`;
  try {
    const res = await fetch('http://localhost:5000/api/medgemma', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    return data.response || (typeof fallback === 'function' ? fallback() : fallback);
  } catch (err) {
    console.error('[AI Local]', err.message);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}
const askMedGemma = askMedGemmaText;
import { useClinic } from '../../context/ClinicContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, Camera, FileText, Clock,
  ChevronRight, Gavel, Scale, ChevronLeft, Brain, CheckCircle2,
  Loader, X, Upload
} from 'lucide-react';

const ACTIVE_DISPUTES = [
  { id: "DIS-9902", asset: "CT Scanner Unit",  issue: "Seal Breach",    status: "Under Review",  severity: "High",   time: "09:12 AM" },
  { id: "DIS-9841", asset: "Dialysis Pump",    issue: "Late Delivery",  status: "Awaiting Proof",severity: "Medium", time: "11:45 AM" },
];

const DAMAGE_TYPES = ["Electrical Fault", "Physical Impact", "Transit Delay", "Temperature Breach", "Documentation Error", "Theft / Loss"];

export default function LogisticsIncident() {
  const navigate = useNavigate();
  const { addIncidentEntry, freezeContract } = useClinic();
  const [selected, setSelected]     = useState(null);
  const [damageType, setDamageType] = useState('');
  const [details, setDetails]       = useState('');
  const [frozen, setFrozen]         = useState(false);
  const [freezing, setFreezing]     = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult]     = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [photos, setPhotos]         = useState([]);
  const [view, setView]             = useState('list'); // list | new

  const INCIDENT_FALLBACKS = {
    "Electrical Fault":    {severity_level:'P1',severity_label:'Critical',immediate_actions:['Isolate unit from power immediately','Inspect for burn marks or electrical arcing','File insurance claim and notify equipment owner'],escrow_recommendation:'Freeze Immediately',clinical_risk:'High — faulty electrical equipment may harm patients if deployed.',resolution_timeline:'2-4 hours',insurance_flag:true},
    "Physical Impact":     {severity_level:'P2',severity_label:'Serious',immediate_actions:['Photograph all impact points from multiple angles','Run structural integrity check before any clinical use','Hold delivery pending full inspection'],escrow_recommendation:'Partial Hold',clinical_risk:'Moderate — physical damage may compromise imaging accuracy or sterility.',resolution_timeline:'24-48 hours',insurance_flag:true},
    "Transit Delay":       {severity_level:'P3',severity_label:'Minor',immediate_actions:['Notify clinic of revised ETA','Update dispatch timeline in system','Confirm asset condition with driver'],escrow_recommendation:'No Action',clinical_risk:'Low — delay causes inconvenience only, no direct patient risk.',resolution_timeline:'Same day',insurance_flag:false},
    "Temperature Breach":  {severity_level:'P1',severity_label:'Critical',immediate_actions:['Quarantine unit immediately','Log breach duration and peak temperature','Contact manufacturer for urgent re-certification'],escrow_recommendation:'Freeze Immediately',clinical_risk:'Critical — temperature excursion may have compromised sterile or cryogenic components.',resolution_timeline:'6-12 hours',insurance_flag:true},
    "Documentation Error": {severity_level:'P3',severity_label:'Minor',immediate_actions:['Retrieve correct documents from origin site','Obtain digital signatures from both parties','Update chain-of-custody records immediately'],escrow_recommendation:'No Action',clinical_risk:'Minimal — compliance documentation issue only.',resolution_timeline:'1-2 hours',insurance_flag:false},
    "Theft / Loss":        {severity_level:'P1',severity_label:'Critical',immediate_actions:['Report to law enforcement with asset serial numbers immediately','Activate GPS tracker and share coordinates with authorities','Freeze all contracts and escrow pending investigation'],escrow_recommendation:'Freeze Immediately',clinical_risk:'Critical — stolen medical equipment poses risk of patient harm through misuse.',resolution_timeline:'Immediate',insurance_flag:true},
  };
  const runAiAnalysis = async () => {
    if (!damageType || !details.trim()) return;
    setAiLoading(true);
    const result = await askMedGemmaJSON(
      `You are MedGemma, AI safety analyst for ResourceRX medical logistics. Analyse THIS SPECIFIC incident type: "${damageType}". Return ONLY valid JSON (no markdown): {"severity_level":"P1"|"P2"|"P3","severity_label":"Critical"|"Serious"|"Minor","immediate_actions":[string,string,string],"escrow_recommendation":"Freeze Immediately"|"Partial Hold"|"No Action","clinical_risk":string,"resolution_timeline":string,"insurance_flag":boolean}`,
      `Incident type: ${damageType}. Details: ${details}`,
      INCIDENT_FALLBACKS[damageType] || INCIDENT_FALLBACKS["Physical Impact"]
    );
    setAiResult(result);
    setAiLoading(false);
  };

  // Session-persist submitted incidents and frozen contracts
  const [incidentLog, setIncidentLog] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('rrx_incident_filed') || '[]'); } catch { return []; }
  });
  const [frozenContracts, setFrozenContracts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('rrx_frozen_contracts') || '[]'); } catch { return []; }
  });

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const entry = {
        id: `INC-${Date.now()}`,
        type: damageType,
        details,
        severity: aiResult?.severity_label || 'Pending',
        escrow: aiResult?.escrow_recommendation || 'Reviewing',
        timestamp: new Date().toLocaleString(),
        status: 'Filed',
      };
      const updated = [entry, ...incidentLog];
      setIncidentLog(updated);
      sessionStorage.setItem('rrx_incident_filed', JSON.stringify(updated));
      // Also log to shared context
      try { addIncidentEntry({ type: damageType, severity: entry.severity, details, source: 'Logistics' }); } catch {}
      // Also add to handover log as INCIDENT status
      try {
        const logs = JSON.parse(sessionStorage.getItem('rrx_handover_log') || '[]');
        logs.unshift({ id: entry.id, asset: damageType, clinic: 'Field Report', date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}).toUpperCase(), status:'INCIDENT', type:'Emergency', tech:'Logistics Team', amount:'TBD' });
        sessionStorage.setItem('rrx_handover_log', JSON.stringify(logs.slice(0,50)));
      } catch {}
      setSubmitted(true);
      setSubmitting(false);
    }, 2000);
  };

  const [disputes, setDisputes] = useState(ACTIVE_DISPUTES);
  const handleFreeze = () => {
    setFreezing(true);
    setTimeout(() => {
      const contractId = selected || disputes[0]?.id || 'DIS-MANUAL';
      const entry = { contractId, reason: details || damageType || 'Manual freeze', frozenAt: new Date().toLocaleString() };
      const updated = [entry, ...frozenContracts];
      setFrozenContracts(updated);
      sessionStorage.setItem('rrx_frozen_contracts', JSON.stringify(updated));
      // Update the dispute status to show frozen
      setDisputes(prev => prev.map(d => d.id === contractId ? {...d, status:'FROZEN ❄️'} : d));
      setFrozen(true);
      setFreezing(false);
    }, 1800);
  };

  const glassStyle = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";
  const SEV_COLOR = { P1: 'bg-red-500', P2: 'bg-amber-500', P3: 'bg-blue-400' };

  return (
    <div className="pt-20 pb-20 px-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-10">
        <button onClick={() => navigate('/logistics')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
          <ChevronLeft size={14} /> Fleet Command
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-100 text-[10px] font-black uppercase mb-3 text-red-600">
              <ShieldAlert size={14} /> Protocol Enforcement
            </div>
            <h2 className="text-5xl font-black tracking-tighter italic text-primary">Incident & Damage</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view==='list'?'bg-primary text-white':'glass-panel opacity-50 hover:opacity-100 text-primary'}`}>
              Open Cases
            </button>
            <button onClick={() => setView('new')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view==='new'?'bg-red-500 text-white':'glass-panel opacity-50 hover:opacity-100 text-primary'}`}>
              + New Report
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-6">
              <div className={glassStyle}>
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-primary">
                  <Scale className="text-secondary" /> Open Arbitration Cases
                </h3>
                <div className="space-y-4">
                  {disputes.map(d => (
                    <div key={d.id}
                      onClick={() => { setSelected(d.id); setView('new'); }}
                      className="p-6 bg-white/40 rounded-[2.5rem] border border-white flex items-center justify-between group hover:bg-white/60 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${d.severity==='High'?'bg-red-500 text-white':'bg-amber-500 text-white'}`}>
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="font-black text-lg tracking-tight uppercase text-primary">{d.asset}</p>
                          <p className="text-[10px] font-bold opacity-40 uppercase text-primary">{d.id} · {d.issue} · {d.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase opacity-40 italic text-primary">{d.status}</span>
                        <button className="p-3 bg-primary text-white rounded-2xl group-hover:scale-110 transition-transform">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Session-filed incidents */}
                  {incidentLog.map(inc => (
                    <div key={inc.id} className="p-6 bg-red-50 rounded-[2.5rem] border border-red-200 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center"><ShieldAlert size={20}/></div>
                        <div>
                          <p className="font-black text-sm uppercase text-red-800">{inc.type}</p>
                          <p className="text-[9px] font-bold text-red-500 uppercase">{inc.id} · Severity: {inc.severity} · {inc.timestamp}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-red-500 text-white px-3 py-1 rounded-full">{inc.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frozen contracts */}
              {frozenContracts.length > 0 && (
                <div className={glassStyle}>
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-primary">
                    <Gavel className="text-secondary"/> Frozen Smart Contracts ({frozenContracts.length})
                  </h3>
                  <div className="space-y-3">
                    {frozenContracts.map((fc, i) => (
                      <div key={i} className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-black text-xs uppercase text-amber-800">Contract: {fc.contractId}</p>
                          <p className="text-[9px] font-bold uppercase text-amber-600">{fc.reason || 'Manual freeze'} · {fc.frozenAt}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">FROZEN ❄️</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence wall */}
              <div className={glassStyle}>
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-primary">
                  <Camera className="text-secondary" /> Media Evidence Wall
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {photos.length > 0 ? photos.map((p, i) => (
                    <div key={i} className="aspect-square rounded-3xl overflow-hidden border-2 border-secondary">
                      <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )) : [1,2,3,4].map(i => (
                    <label key={i} className="aspect-square glass-panel rounded-3xl bg-slate-100/50 flex flex-col items-center justify-center gap-2 border-dashed border-2 border-primary/10 hover:border-secondary transition-all cursor-pointer">
                      <Upload size={18} className="opacity-20" />
                      <span className="text-[8px] font-black opacity-30 uppercase text-center px-2 text-primary">Upload Evidence</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files[0] && setPhotos(prev => [...prev, e.target.files[0]])} />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: FREEZE + TIMELINE */}
            <div className="space-y-6">
              <div className={`${glassStyle} ${frozen ? 'bg-emerald-600' : 'bg-red-500'} text-white border-none shadow-xl`}>
                <Gavel size={32} className="mb-6 opacity-40" />
                <h3 className="text-2xl font-black tracking-tighter mb-4 italic">
                  {frozen ? 'Contract Frozen ✓' : 'Freeze Smart Contract'}
                </h3>
                <p className="text-xs font-bold leading-relaxed opacity-80 mb-8 uppercase">
                  {frozen
                    ? 'All funds suspended. 24-hour verification window active. All parties notified.'
                    : 'Suspend all funds for the active transport. Triggers 24-hour verification window.'}
                </p>
                {!frozen && (
                  <button onClick={handleFreeze} disabled={freezing}
                    className="w-full bg-white text-red-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                    {freezing ? <><Loader size={14} className="animate-spin" /> Freezing…</> : 'Initiate Freeze'}
                  </button>
                )}
              </div>

              <div className={glassStyle}>
                <p className="text-[10px] font-black opacity-30 uppercase mb-6 tracking-widest text-primary">Protocol Timeline</p>
                <div className="space-y-5">
                  {[
                    { time: "09:12", event: "Incident Flagged by Driver" },
                    { time: "10:05", event: "Photo Metadata Verified"    },
                    { time: "11:30", event: "Owner Notified via Portal"  },
                    { time: "12:00", event: "Arbitration Case Opened"    },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 border-l-2 border-primary/10 ml-2 pl-6 relative">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                      <div>
                        <p className="text-[10px] font-black opacity-30 italic text-primary">{step.time}</p>
                        <p className="text-xs font-bold uppercase text-primary">{step.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => navigate('/logistics/logs')}
                className="w-full glass-panel py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/60 transition-all flex items-center justify-center gap-2">
                <FileText size={14} /> View All Logs
              </button>
            </div>
          </motion.div>
        )}

        {/* ── NEW REPORT VIEW ── */}
        {view === 'new' && (
          <motion.div key="new" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto w-full">
            <div className={glassStyle}>

              {submitted ? (
                <div className="text-center py-16">
                  <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-black text-primary mb-2">Report Submitted</h3>
                  <p className="opacity-40 text-sm font-bold uppercase mb-8">Protocol 12-B enforced. Escrow review triggered.</p>
                  <button onClick={() => { setSubmitted(false); setView('list'); setAiResult(null); setDamageType(''); setDetails(''); }}
                    className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                    Back to Cases
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/30"><ShieldAlert /></div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic text-primary">File Incident Report</h3>
                  </div>

                  {/* DAMAGE TYPE */}
                  <div className="mb-8">
                    <p className="text-[10px] font-black opacity-30 uppercase mb-4 tracking-widest text-primary">Incident Type</p>
                    <div className="grid grid-cols-3 gap-3">
                      {DAMAGE_TYPES.map(t => (
                        <button key={t} onClick={() => setDamageType(t)}
                          className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all border ${damageType===t ? 'bg-red-500 text-white border-red-500' : 'glass-panel text-primary hover:bg-red-50 border-transparent'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="relative mb-6">
                    <textarea
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      placeholder="Describe the incident in detail — location, time, what happened, what was affected..."
                      className="w-full glass-panel p-8 rounded-[2rem] h-40 font-bold outline-none text-primary border-primary/5 focus:border-red-300 transition-all resize-none"
                    />
                    <AlertTriangle className="absolute bottom-5 right-5 text-red-500 opacity-20" size={28} />
                  </div>

                  {/* AI ANALYSIS */}
                  <button onClick={runAiAnalysis} disabled={!damageType || !details.trim() || aiLoading}
                    className="w-full mb-6 py-4 bg-primary/5 border border-primary/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                    {aiLoading ? <><Loader size={14} className="animate-spin" /> Analysing…</> : <><Brain size={14} /> Run MedGemma Risk Analysis</>}
                  </button>

                  {/* AI RESULT */}
                  {aiResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-8 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-5">
                      <div className="flex items-center gap-4">
                        <span className={`${SEV_COLOR[aiResult.severity_level]} text-white px-4 py-1 rounded-full text-[10px] font-black uppercase`}>
                          {aiResult.severity_level} — {aiResult.severity_label}
                        </span>
                        {aiResult.insurance_flag && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Insurance Flag</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-primary/70 italic">{aiResult.clinical_risk}</p>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40 mb-2 text-primary">Immediate Actions</p>
                        <ul className="space-y-1">
                          {aiResult.immediate_actions.map((a, i) => (
                            <li key={i} className="text-xs font-bold text-primary flex items-start gap-2">
                              <span className="text-secondary font-black">{i+1}.</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-4 text-[10px] font-black uppercase">
                        <span className="text-primary/40">Escrow: <span className="text-primary">{aiResult.escrow_recommendation}</span></span>
                        <span className="text-primary/40">ETA: <span className="text-primary">{aiResult.resolution_timeline}</span></span>
                      </div>
                    </motion.div>
                  )}

                  <div className="p-5 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 mb-6">
                    <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] font-black text-red-700/70 leading-relaxed uppercase italic">
                      Filing this report triggers an immediate escrow freeze and notifies all platform nodes. Protocol 12-B enforced.
                    </p>
                  </div>

                  <button onClick={handleSubmit} disabled={!damageType || !details.trim() || submitting}
                    className="w-full bg-red-500 disabled:bg-red-200 disabled:cursor-not-allowed text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                    {submitting ? <><Loader size={16} className="animate-spin" /> Submitting…</> : 'Submit Incident Protocol'}
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