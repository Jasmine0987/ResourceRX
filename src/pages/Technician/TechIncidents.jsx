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
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon, ShieldAlert, MessageSquare, PhoneCall,
  Camera, History, Info, ChevronRight, Flame,
  ChevronLeft, Loader, CheckCircle2, X, BrainCircuit, Upload
} from 'lucide-react';

const HISTORY_INIT = [
  { id:"INC-882", asset:"GE CT #102",    issue:"Heater Circuit Fault",     status:"Resolved",   date:"Jan 12", severity:"Medium" },
  { id:"INC-741", asset:"Mobile X-Ray",  issue:"Grid Calibration Error",   status:"In Review",  date:"Jan 08", severity:"Low"    },
];

const SEVERITY_OPTIONS = ['Low','Medium','Critical'];
const FAILURE_TYPES = ["Mechanical Failure","Cryogen Leak / Quench","Software Kernel Panic","Safety Breach (Patient)","Electrical Fault","Sensor Out-of-Range"];

export default function TechIncidents() {
  const navigate = useNavigate();
  const fileRef  = useRef();
  const [view,       setView]      = useState('report');
  const [severity,   setSeverity]  = useState('');
  const [failType,   setFailType]  = useState('');
  const [details,    setDetails]   = useState('');
  const [photos,     setPhotos]    = useState([]);
  const [aiResult,   setAiResult]  = useState(null);
  const [aiLoading,  setAiLoad]    = useState(false);
  const [submitting, setSubmit]    = useState(false);
  const [submitted,  setSubmitted] = useState(false);
  const [history,    setHistory]   = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('rrx_tech_incidents') || '[]');
      return [...saved, ...HISTORY_INIT];
    } catch { return HISTORY_INIT; }
  });
  const [chatOpen,   setChatOpen]  = useState(false);
  const [chatMsg,    setChatMsg]   = useState('');
  const [chatLog,    setChatLog]   = useState([
    { from:'system', text:"Command Link active. Senior Engineer on standby." }
  ]);

  const INC_FALLBACK = {risk_level:"P2-Serious",immediate_actions:["Isolate unit from patient workflow immediately","Alert on-call engineer and notify site manager","Document all sensor readings before moving the unit"],patient_risk:"No immediate patient risk, but clinical imaging may be unreliable until resolved.",escrow:"Partial Hold",protocol:"Protocol 12-B: Equipment Safety Hold",resolution_eta:"4–8 hours with on-site engineer"};
  const runAI = async () => {
    if (!failType || !details.trim()) return;
    setAiLoad(true); setAiResult(null);
    const result = await askMedGemmaJSON(
      `You are MedGemma, AI safety analyst for ResourceRX. Analyse THIS SPECIFIC incident: "${failType}". Return ONLY valid JSON: {"risk_level":"P1-Critical"|"P2-Serious"|"P3-Minor","immediate_actions":[string,string,string],"patient_risk":string,"escrow":"Freeze"|"Partial Hold"|"No Action","protocol":string,"resolution_eta":string}`,
      `Failure type: ${failType}. Severity: ${severity}. Technician observations: ${details}`,
      INC_FALLBACK
    );
    setAiResult(result);
    setAiLoad(false);
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg.trim();
    setChatLog(prev => [...prev, { from:'user', text:userMsg }]);
    setChatMsg('');
    const reply = await askMedGemmaText(
      "You are a senior medical equipment engineer on the ResourceRX command link. Provide brief, direct technical guidance to a field technician. Be concise and use engineering shorthand where appropriate.",
      userMsg,
      "CONNECTION ISSUE. Try again or call direct line."
    );
    setChatLog(prev => [...prev, { from:'engineer', text:reply }]);
  };

  const submitReport = () => {
    if (!failType || !severity || !details.trim()) return;
    setSubmit(true);
    setTimeout(() => {
      const newEntry = { id:`INC-${Date.now()}`, asset:"Active Asset", issue:failType, status:"Filed", date:"Today", severity };
      setHistory(prev => {
        const updated = [newEntry, ...prev];
        // Persist only the new entries (not HISTORY_INIT)
        const toSave = updated.filter(h => h.date === 'Today' || h.status === 'Filed');
        sessionStorage.setItem('rrx_tech_incidents', JSON.stringify(toSave));
        return updated;
      });
      setSubmit(false);
      setSubmitted(true);
      // Auto-switch to history tab after 2s so user sees their filed entry
      setTimeout(() => { setSubmitted(false); setView('history'); }, 3000);
    }, 2200);
  };

  const RISK_COLOR = { 'P1-Critical':'bg-red-50 border-red-300 text-red-700', 'P2-Serious':'bg-amber-50 border-amber-300 text-amber-700', 'P3-Minor':'bg-emerald-50 border-emerald-300 text-emerald-600' };
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  if (submitted) return (
    <div className="max-w-xl mx-auto pt-24 text-center pb-20">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring'}}>
        <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-8"/>
      </motion.div>
      <h2 className="text-4xl font-black tracking-tighter text-primary mb-4">Incident Filed</h2>
      <p className="text-sm font-bold opacity-50 uppercase text-primary mb-10">Report submitted to Command. Escrow protocol initiated. You will be contacted within 30 minutes.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={()=>{setSubmitted(false);setFailType('');setSeverity('');setDetails('');setPhotos([]);setAiResult(null);}}
          className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">File Another</button>
        <button onClick={()=>navigate('/tech')} className="glass-panel px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary">Ops Center</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 text-[10px] font-black uppercase mb-3 text-red-500 border border-red-500/20">
            <AlertOctagon size={12} className="animate-pulse"/> Emergency Response Active
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Incident Portal</h2>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-white/40 p-2 rounded-3xl">
            {['report','history'].map(v => (
              <button key={v} onClick={()=>setView(v)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view===v?'bg-primary text-white shadow':'opacity-40 text-primary hover:opacity-100'}`}>
                {v==='report'?'File Report':'History'}
              </button>
            ))}
          </div>
          <button onClick={submitReport} disabled={!failType||!severity||!details.trim()||submitting}
            className="bg-red-500 disabled:bg-red-200 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">
            {submitting?<Loader size={16} className="animate-spin"/>:<Flame size={16}/>}
            {submitting?'Transmitting…':'File Critical Report'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'report' && (
          <motion.div key="report" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}
            className="grid lg:grid-cols-3 gap-8">

            {/* FORM */}
            <div className={`lg:col-span-2 ${glass} border-red-500/10`}>
              <h3 className="text-2xl font-black italic uppercase mb-8 text-primary">Asset Breakdown Entry</h3>
              <div className="space-y-6">

                {/* FAILURE TYPE */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest text-primary block mb-3">Failure Classification *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FAILURE_TYPES.map(f => (
                      <button key={f} onClick={()=>setFailType(f)}
                        className={`py-4 px-5 rounded-2xl text-[10px] font-black uppercase border text-left transition-all ${failType===f?'bg-primary text-white border-primary':'bg-white/40 border-white hover:bg-white text-primary'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SEVERITY */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest text-primary block mb-3">Severity Level *</label>
                  <div className="flex gap-3">
                    {SEVERITY_OPTIONS.map(lvl => (
                      <button key={lvl} onClick={()=>setSeverity(lvl)}
                        className={`flex-1 py-5 rounded-3xl text-[10px] font-black uppercase border transition-all ${
                          severity===lvl
                            ? lvl==='Critical'?'bg-red-500 text-white border-red-500':lvl==='Medium'?'bg-amber-500 text-white border-amber-500':'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white/40 border-white text-primary opacity-50 hover:opacity-100'
                        }`}>
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DETAILS */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest text-primary block mb-3">Observations *</label>
                  <textarea value={details} onChange={e=>setDetails(e.target.value)}
                    placeholder="Describe the failure state in detail — include any error codes, sounds, smells, or patient proximity..."
                    className="w-full glass-panel px-8 py-6 rounded-[2.5rem] font-bold bg-white/50 outline-none h-36 resize-none text-primary focus:ring-2 ring-red-300"/>
                </div>

                {/* PHOTO UPLOAD */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest text-primary block mb-3">Evidence Photos</label>
                  <label className="flex items-center gap-4 p-6 border-2 border-dashed border-primary/10 rounded-[2rem] hover:bg-white/40 transition-all cursor-pointer">
                    <Camera className="text-secondary" size={22}/>
                    <span className="text-[10px] font-black uppercase text-primary opacity-60">Attach Photos / Video</span>
                    <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
                      onChange={e=>setPhotos(prev=>[...prev,...Array.from(e.target.files)])}/>
                    {photos.length>0 && <span className="ml-auto text-[10px] font-black text-secondary">{photos.length} file{photos.length>1?'s':''} attached</span>}
                  </label>
                </div>

                {/* AI ANALYSIS */}
                <div className="flex gap-3">
                  <button onClick={runAI} disabled={!failType||!details.trim()||aiLoading}
                    className="flex-1 glass-panel py-5 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase text-primary hover:bg-white transition-all disabled:opacity-40">
                    {aiLoading?<Loader size={16} className="animate-spin"/>:<BrainCircuit size={16}/>}
                    {aiLoading?'MedGemma Analysing…':'Run AI Risk Analysis'}
                  </button>
                  <button onClick={submitReport} disabled={!failType||!severity||!details.trim()||submitting}
                    className="flex-1 bg-primary text-white py-5 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase hover:bg-secondary hover:text-primary transition-all disabled:opacity-40">
                    {submitting?<Loader size={16} className="animate-spin"/>:null}
                    {submitting?'Transmitting…':'Transmit to HQ'}
                  </button>
                </div>

                {/* AI RESULT */}
                <AnimatePresence>
                  {aiResult && (
                    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                      className={`p-8 rounded-[2.5rem] border ${RISK_COLOR[aiResult.risk_level]}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[9px] font-black uppercase mb-1">MedGemma · {aiResult.risk_level}</p>
                          <p className="text-xs font-bold">{aiResult.patient_risk}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase px-3 py-1 bg-black/10 rounded-full">{aiResult.escrow}</span>
                      </div>
                      <div className="space-y-2 border-t border-black/10 pt-4">
                        <p className="text-[9px] font-black uppercase opacity-60">Immediate Actions</p>
                        {aiResult.immediate_actions.map((a,i)=>(
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[9px] font-black opacity-40">{i+1}.</span>
                            <p className="text-[10px] font-bold">{a}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] font-bold opacity-60 mt-3">{aiResult.protocol} · ETA: {aiResult.resolution_eta}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* COMMAND LINK */}
              <div className={`${glass} bg-primary text-white`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black italic uppercase">Command Link</h3>
                  <button onClick={()=>setChatOpen(o=>!o)} className="text-[9px] font-black uppercase bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
                    {chatOpen?'Hide':'Live Chat'}
                  </button>
                </div>

                <AnimatePresence>
                  {chatOpen && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                      className="overflow-hidden mb-4">
                      <div className="space-y-3 max-h-48 overflow-y-auto mb-3 pr-1">
                        {chatLog.map((m,i)=>(
                          <div key={i} className={`p-3 rounded-2xl text-[10px] font-bold ${m.from==='user'?'bg-white/20 text-white ml-4':'bg-white/10 text-white/80'}`}>
                            <span className="text-[8px] opacity-40 uppercase block mb-1">{m.from==='user'?'You':'Engineer'}</span>
                            {m.text}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&sendChat()}
                          placeholder="Ask engineer…"
                          className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-[10px] font-bold outline-none text-white placeholder:opacity-40"/>
                        <button onClick={sendChat} className="bg-secondary text-primary px-4 py-3 rounded-xl font-black text-[9px] uppercase hover:scale-105 transition-all">Send</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-5 bg-white/10 rounded-3xl hover:bg-white/20 transition-all group">
                    <div className="flex items-center gap-4"><PhoneCall className="text-secondary"/><span className="text-xs font-black uppercase tracking-widest">Senior Engineer</span></div>
                    <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform"/>
                  </button>
                  <button onClick={()=>setChatOpen(true)} className="w-full flex items-center justify-between p-5 bg-white/10 rounded-3xl hover:bg-white/20 transition-all group">
                    <div className="flex items-center gap-4"><MessageSquare className="text-secondary"/><span className="text-xs font-black uppercase tracking-widest">Live Support Chat</span></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                  </button>
                </div>
              </div>

              {/* SAFETY INFO */}
              <div className={glass}>
                <div className="flex items-center gap-3 mb-5"><Info className="text-secondary"/><h4 className="text-xs font-black uppercase tracking-tighter text-primary">Site Safety Info</h4></div>
                <p className="text-[10px] font-bold opacity-40 uppercase leading-relaxed text-primary">In case of a magnet quench, evacuate the MRI suite immediately. Oxygen sensors at North and South exits. Emergency stop: red panel near door.</p>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div key="history" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} className={glass}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary flex items-center gap-3">
                <History className="text-primary/20"/> Resolution Log
              </h3>
            </div>
            <div className="space-y-4">
              {history.map((inc,i) => (
                <motion.div key={inc.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                  className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-white/40 rounded-[2.5rem] border border-white hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${inc.status==='Resolved'?'bg-emerald-500/10 text-emerald-500':inc.status==='Filed'?'bg-blue-500/10 text-blue-500':'bg-amber-500/10 text-amber-500'}`}>
                      <ShieldAlert size={20}/>
                    </div>
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase text-primary">{inc.id} · {inc.date} · Severity: {inc.severity}</p>
                      <h4 className="text-sm font-black uppercase tracking-tight text-primary">{inc.issue}</h4>
                      <p className="text-[10px] font-bold opacity-40 uppercase text-primary">{inc.asset}</p>
                    </div>
                  </div>
                  <span className={`mt-4 md:mt-0 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${inc.status==='Resolved'?'bg-emerald-500/10 text-emerald-500':inc.status==='Filed'?'bg-blue-500/10 text-blue-600':'bg-amber-500/10 text-amber-500'}`}>
                    {inc.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}