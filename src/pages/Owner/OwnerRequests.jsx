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
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, MapPin, CheckCircle2, XCircle, Clock, ShieldAlert, Zap, ChevronLeft, Loader, Brain } from 'lucide-react';

const INIT_REQUESTS = [
  { id:"REQ-2025-091", facility:"Apollo Hospitals Hyderabad",  location:"Hyderabad, TG", asset:"Siemens Magnetom Vida 3T (MRI)",  period:"Jan 20 – Feb 28", valuation:"₹62.2L", urgency:"CRITICAL", credibility:98, context:"Critical MRI shortage — 3 cardiac surgical plans pending imaging results at Apollo HITEC." },
  { id:"REQ-2025-094", facility:"Rainbow Children's Hospital", location:"Bengaluru, KA",  asset:"GE Revolution CT 512-Slice",      period:"Feb 05 – Mar 05", valuation:"₹35.1L", urgency:"STANDARD", credibility:100, context:"Routine paediatric screening programme — 120 children on waiting list at Rainbow Marathahalli." },
  { id:"REQ-2025-098", facility:"Fortis Memorial Gurugram",    location:"Gurugram, HR",   asset:"Fresenius 5008S Dialysis (×2)",   period:"Mar 01 – Apr 01", valuation:"₹15.2L", urgency:"STANDARD", credibility:95, context:"Renal unit expansion at Fortis Gurugram — two legacy Nipro machines decommissioned last week." },
];

const AI_FALLBACKS = {
  "REQ-2025-091": { recommendation:"APPROVE", risk_level:"Low",    summary:"Apollo Hyderabad has a 98% trust score with zero payment defaults. The MRI is urgently needed for cardiac surgical planning — denial could delay critical patient care at a Tier-1 facility.", fleet_impact:"South India fleet moves to 85% utilisation. One backup Magnetom Sola remains available at the Bengaluru hub.", counter_offer:null },
  "REQ-2025-094": { recommendation:"APPROVE", risk_level:"Low",    summary:"Rainbow Children's has a perfect 100% trust index. Paediatric CT demand is well-documented and the 30-day window minimises revenue risk.", fleet_impact:"CT fleet at 76% utilisation. No conflict with existing deployments — fills the Feb 5 gap perfectly.", counter_offer:null },
  "REQ-2025-098": { recommendation:"NEGOTIATE", risk_level:"Medium", summary:"Fortis Gurugram dialysis request is legitimate but dispatching 2 units simultaneously strains North India support coverage. Consider staggering.", fleet_impact:"Dispatching both units simultaneously leaves NCR with zero backup dialysis. Recommend releasing 1 unit now, second in 2 weeks.", counter_offer:"Release Unit #1 now (Mar 1) and Unit #2 on Mar 15 — same contract value ₹15.2L, improved fleet resilience." },
};

export default function OwnerRequests() {
  const navigate = useNavigate();

  // Persist requests in sessionStorage so decline survives tab changes
  const [requests, setRequests] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rrx_requests');
      return saved ? JSON.parse(saved) : INIT_REQUESTS.map(r=>({...r,status:'pending'}));
    } catch { return INIT_REQUESTS.map(r=>({...r,status:'pending'})); }
  });

  useEffect(() => {
    sessionStorage.setItem('rrx_requests', JSON.stringify(requests));
  }, [requests]);

  const [processing, setProcessing] = useState(null);
  const [aiLoading,  setAiLoading]  = useState(null);
  const [aiAdvice,   setAiAdvice]   = useState({});

  const act = (id, action) => {
    setProcessing(id + action);
    setTimeout(() => {
      setRequests(prev => {
        const updated = prev.map(r => r.id===id ? {...r,status:action} : r);
        sessionStorage.setItem('rrx_requests', JSON.stringify(updated));
        return updated;
      });
      setProcessing(null);
      if (action === 'approved') {
        // Store the approved request so dispatch can show correct location
        const req = requests.find(r => r.id === id);
        if (req) {
          try {
            const dispatches = JSON.parse(sessionStorage.getItem('rrx_owner_dispatches') || '[]');
            dispatches.unshift({
              id: `DEP-${Date.now()}`,
              requestId: req.id,
              facility: req.facility,
              location: req.location,
              asset: req.asset,
              period: req.period,
              valuation: req.valuation,
              authorizedAt: new Date().toLocaleString(),
              status: 'Deploying',
            });
            sessionStorage.setItem('rrx_owner_dispatches', JSON.stringify(dispatches));
          } catch {}
        }
        setTimeout(() => navigate('/owner/dispatch'), 600);
      }
    }, 1800);
  };

  const runAI = async (req) => {
    setAiLoading(req.id);
    const result = await askMedGemmaJSON(
      `You are MedGemma, risk advisor for ResourceRX equipment rental platform. Analyse THIS SPECIFIC request and return ONLY valid JSON:
{"recommendation":"APPROVE"|"DECLINE"|"NEGOTIATE","risk_level":"Low"|"Medium"|"High","summary":string,"fleet_impact":string,"counter_offer":string|null}`,
      `Request ID: ${req.id}
Facility: ${req.facility} — ${req.location}
Asset requested: ${req.asset}
Rental period: ${req.period}
Contract value: ${req.valuation}
Urgency: ${req.urgency}
Facility trust score: ${req.credibility}%
Clinical context: ${req.context}
Provide advice specific to this request — do not give generic answers.`,
      AI_FALLBACKS[req.id]
    );
    setAiAdvice(prev => ({...prev, [req.id]: result}));
    setAiLoading(null);
  };

  const pending  = requests.filter(r=>r.status==='pending');
  const done     = requests.filter(r=>r.status!=='pending');
  const glass    = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  const ADVICE_COLOR = { APPROVE:'text-emerald-600 bg-emerald-50 border-emerald-200', DECLINE:'text-red-600 bg-red-50 border-red-200', NEGOTIATE:'text-amber-600 bg-amber-50 border-amber-200' };

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-10">

      <div className="mb-8">
        <button onClick={()=>navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
          <ChevronLeft size={14}/> Control Center
        </button>
        <div className="flex justify-between items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-3 text-primary">
              <CalendarClock size={14} className="text-secondary"/> Queue Management
            </div>
            <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Inbound Requests</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">Pending</p>
            <p className="text-2xl font-black text-secondary">{pending.length.toString().padStart(2,'0')} Active</p>
          </div>
        </div>
      </div>

      {pending.length === 0 && (
        <div className={`${glass} text-center py-16`}>
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4"/>
          <p className="text-xl font-black text-primary">All requests processed</p>
          <p className="text-xs font-bold opacity-30 uppercase text-primary mt-2">Check the "Recently Processed" section below</p>
        </div>
      )}

      <div className="grid gap-8">
        <AnimatePresence>
          {pending.map((req, i) => {
            const advice = aiAdvice[req.id];
            const isProc = processing?.startsWith(req.id);

            return (
              <motion.div key={req.id} initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-40}} transition={{delay:i*0.1}}
                className={`${glass} group hover:border-secondary/30 transition-all`}>

                {req.urgency==='CRITICAL' && (
                  <div className="absolute top-0 right-0 px-10 py-2 bg-secondary text-primary text-[10px] font-black uppercase tracking-widest rounded-bl-[2rem]">High Priority</div>
                )}

                <div className="grid lg:grid-cols-4 gap-10 items-center">
                  <div className="lg:col-span-1 border-r border-primary/5 pr-8">
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-3 text-primary">{req.id}</p>
                    <h3 className="text-xl font-black tracking-tighter text-primary mb-1">{req.facility}</h3>
                    <p className="text-xs font-bold opacity-40 uppercase text-primary flex items-center gap-1"><MapPin size={10}/> {req.location}</p>
                    <div className="mt-4">
                      <p className="text-[9px] font-black uppercase opacity-30 mb-1 text-primary">Trust Index</p>
                      <div className="h-1.5 bg-primary/10 rounded-full"><div className="h-full bg-secondary rounded-full" style={{width:`${req.credibility}%`}}/></div>
                      <p className="text-xs font-black text-secondary mt-1">{req.credibility}%</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2 text-primary">Equipment</p>
                    <p className="text-2xl font-black text-primary tracking-tighter">{req.asset}</p>
                    <div className="flex gap-6 mt-4">
                      <div><p className="text-[9px] opacity-30 uppercase font-black text-primary flex items-center gap-1"><Clock size={9}/> Period</p><p className="font-black text-xs text-primary">{req.period}</p></div>
                      <div><p className="text-[9px] opacity-30 uppercase font-black text-primary flex items-center gap-1"><Zap size={9}/> Value</p><p className="font-black text-xs text-secondary">{req.valuation}</p></div>
                    </div>
                    <p className="text-[10px] font-bold opacity-40 mt-3 text-primary italic">"{req.context}"</p>
                  </div>

                  <div className="lg:col-span-1 flex flex-col gap-3">
                    <button onClick={()=>act(req.id,'approved')} disabled={!!isProc}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {processing===req.id+'approved'?<Loader size={14} className="animate-spin"/>:<CheckCircle2 size={14}/>}
                      {processing===req.id+'approved'?'Authorising…':'Authorise'}
                    </button>
                    <button onClick={()=>act(req.id,'declined')} disabled={!!isProc}
                      className="w-full py-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {processing===req.id+'declined'?<Loader size={14} className="animate-spin text-red-400"/>:<XCircle size={14}/>}
                      {processing===req.id+'declined'?'Declining…':'Decline'}
                    </button>
                    <button onClick={()=>runAI(req)} disabled={aiLoading===req.id || !!isProc}
                      className="w-full py-4 glass-panel rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-white/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {aiLoading===req.id?<><Loader size={14} className="animate-spin"/> Analysing…</>:<><Brain size={14}/> AI Advice</>}
                    </button>
                  </div>
                </div>

                {/* AI ADVICE — unique per request */}
                <AnimatePresence>
                  {advice && (
                    <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                      className="mt-8 overflow-hidden">
                      <div className={`p-8 rounded-[2rem] border ${ADVICE_COLOR[advice.recommendation]}`}>
                        <div className="flex items-center gap-4 mb-4">
                          <Brain size={18}/>
                          <p className="text-[10px] font-black uppercase tracking-widest">MedGemma · {advice.recommendation}</p>
                          <span className={`ml-auto text-[9px] font-black uppercase px-3 py-1 rounded-full bg-black/10`}>Risk: {advice.risk_level}</span>
                        </div>
                        <p className="text-sm font-bold mb-3">{advice.summary}</p>
                        <p className="text-[11px] font-bold opacity-70 mb-2"><span className="font-black uppercase">Fleet Impact:</span> {advice.fleet_impact}</p>
                        {advice.counter_offer && (
                          <div className="mt-3 p-4 bg-white/50 rounded-xl border border-current/20">
                            <p className="text-[9px] font-black uppercase mb-1">Counter Offer</p>
                            <p className="text-xs font-bold">{advice.counter_offer}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* RISK ADVISORY */}
      {pending.some(r=>r.urgency==='CRITICAL') && (
        <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 flex items-center gap-6">
          <ShieldAlert className="text-amber-500 shrink-0" size={28}/>
          <div>
            <p className="text-xs font-black uppercase text-amber-600">Fleet Capacity Warning</p>
            <p className="text-[11px] font-bold opacity-60 text-primary">Accepting Apollo Hyderabad will put South India fleet at 100% utilisation. No backup MRI in Hyderabad for 40 days. Consider AI advice before authorising.</p>
          </div>
        </div>
      )}

      {/* RECENTLY PROCESSED */}
      {done.length > 0 && (
        <div className={glass}>
          <h3 className="text-xl font-black italic uppercase mb-6 text-primary">Recently Processed</h3>
          <div className="space-y-3">
            {done.map(req => (
              <div key={req.id} className="flex items-center justify-between p-6 bg-white/40 rounded-2xl border border-white">
                <div>
                  <p className="text-[9px] font-black opacity-30 uppercase text-primary">{req.id}</p>
                  <p className="font-black text-sm text-primary">{req.facility} · {req.asset}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full ${req.status==='approved'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-600'}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
          <button onClick={()=>{setRequests(INIT_REQUESTS.map(r=>({...r,status:'pending'}))); sessionStorage.removeItem('rrx_requests');}}
            className="mt-6 text-[9px] font-black uppercase opacity-30 hover:opacity-100 text-primary transition-opacity">
            Reset all requests
          </button>
        </div>
      )}
    </div>
  );
}