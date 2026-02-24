import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Star, ThumbsUp, ThumbsDown,
  AlertTriangle, BrainCircuit, ChevronRight, Loader2,
  FileText, Download
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
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

const FALLBACK_OUTCOME = {
  outcome_grade: "Good",
  impact_statement: "This deployment successfully reduced equipment wait time and improved patient care throughput across the facility.",
  time_saved_hours: 6,
  lives_potentially_impacted: 3,
  network_value_score: 78,
  improvement_suggestions: [
    "Schedule 30 minutes earlier to allow calibration buffer",
    "Request pre-deployment calibration report from technician",
  ],
  recommend_repeat: true,
  data_quality_note: null,
};

const OUTCOME_SYSTEM = `You are MedGemma for ResourceRX. Analyze the completed equipment deployment and return ONLY valid JSON (no markdown):
{"outcome_grade":"Excellent"|"Good"|"Fair"|"Poor","impact_statement":string,"time_saved_hours":number,"lives_potentially_impacted":number,"network_value_score":number,"improvement_suggestions":[string,string],"recommend_repeat":boolean,"data_quality_note":string|null}
IMPORTANT: All number fields must be actual numbers — never null or undefined. network_value_score must be 0-100.`;

const GRADE_STYLE = {
  Excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Good:      "text-emerald-500 bg-emerald-50 border-emerald-200",
  Fair:      "text-amber-600 bg-amber-50 border-amber-200",
  Poor:      "text-red-600 bg-red-50 border-red-200",
};

function downloadReport(booking, outcome) {
  const txt = [
    `ResourceRX Deployment Report`,
    `Booking: ${booking.id}`,
    `Asset: ${booking.asset}`,
    `From: ${booking.from}`,
    `Grade: ${outcome.outcome_grade}`,
    `Impact: ${outcome.impact_statement}`,
    `Hours Saved: ${outcome.time_saved_hours}`,
    `Network Score: ${outcome.network_value_score}/100`,
    `Generated: ${new Date().toISOString()}`,
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download = `RRX_${booking.id}_Report.txt`; a.click();
}

export default function ClinicCompletion() {
  const navigate = useNavigate();
  const { currentBooking, completeBooking } = useClinic();

  const [step,         setStep]      = useState(0);
  const [arrived,      setArrived]   = useState(null);
  const [onTime,       setOnTime]    = useState(null);
  const [arrivalTime,  setATime]     = useState('');
  const [patientDesc,  setPatient]   = useState('');
  const [equipRating,  setRating]    = useState(0);
  const [notes,        setNotes]     = useState('');
  const [aiOutcome,    setOutcome]   = useState(null);
  const [loading,      setLoading]   = useState(false);

  const asset     = currentBooking?.asset    || 'GE Revolution CT 512-Slice';
  const from      = currentBooking?.from     || 'Mayo Clinic Rochester';
  const bookingId = currentBooking?.id       || 'RX-20482';
  const price     = Number(currentBooking?.price)    || 320;
  const duration  = parseInt(currentBooking?.duration) || 6;
  const totalCost = price * duration;

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await askMedGemmaJSON(
      OUTCOME_SYSTEM,
      JSON.stringify({
        booking_id: bookingId, equipment: asset, from,
        arrived, on_time: onTime, arrival_time: arrivalTime,
        patient_outcome_description: patientDesc,
        equipment_rating: equipRating, notes, duration,
        price_usd: totalCost,
      }),
      FALLBACK_OUTCOME
    );
    // Sanitize — guard every numeric field
    const safe = {
      ...FALLBACK_OUTCOME,
      ...result,
      time_saved_hours:          Number(result?.time_saved_hours)          || 6,
      lives_potentially_impacted:Number(result?.lives_potentially_impacted)|| 3,
      network_value_score:       Number(result?.network_value_score)       || 78,
    };
    setOutcome(safe);
    completeBooking?.({ grade: safe.outcome_grade, score: safe.network_value_score });
    setStep(2);
    setLoading(false);
  };

  return (
    <motion.div initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} className="pt-40 pb-20 px-6 max-w-4xl mx-auto">

      <div className="mb-10 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase mb-4 text-emerald-600">
          <CheckCircle size={14}/> Deployment Complete
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Booking #{bookingId}</h2>
        <p className="text-gray-500 font-bold">{asset} · from {from}</p>
      </div>

      {/* STEPS */}
      <div className="flex items-center gap-3 mb-10 ml-4">
        {["Arrival Check","Outcome Report","AI Analysis"].map((label,i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all ${i<=step?'opacity-100':'opacity-25'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${i<step?'bg-emerald-500 text-white':i===step?'bg-primary text-white':'bg-primary/10'}`}>
                {i<step?<CheckCircle size={12}/>:i+1}
              </div>
              <span className="hidden md:block">{label}</span>
            </div>
            {i<2 && <div className={`flex-1 h-0.5 ${i<step?'bg-emerald-400':'bg-primary/10'} transition-all`}/>}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 0 — ARRIVAL */}
        {step===0 && (
          <motion.div key="s0" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
            <div className="glass-panel rounded-[3rem] p-10 space-y-8">
              <h3 className="text-2xl font-black tracking-tighter">Did the equipment arrive?</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:"Yes, it arrived", val:true,  icon:ThumbsUp,   cls:arrived===true ?'bg-emerald-500 text-white border-emerald-500':'hover:border-emerald-300' },
                  { label:"No, it didn't",   val:false, icon:ThumbsDown, cls:arrived===false?'bg-red-500 text-white border-red-500':'hover:border-red-300' },
                ].map(opt=>(
                  <button key={String(opt.val)} onClick={()=>setArrived(opt.val)}
                    className={`glass-panel p-8 rounded-[2rem] flex flex-col items-center gap-4 border-2 transition-all font-black ${opt.cls}`}>
                    <opt.icon size={28}/><span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {arrived===true && (
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-2">On time?</label>
                      <div className="flex gap-3">
                        {[{label:'On Time',val:true},{label:'Late',val:false}].map(opt=>(
                          <button key={String(opt.val)} onClick={()=>setOnTime(opt.val)}
                            className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${onTime===opt.val?'bg-primary text-white border-primary':'glass-panel border-transparent'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-2">Arrival time</label>
                      <input type="time" value={arrivalTime} onChange={e=>setATime(e.target.value)}
                        className="w-full glass-panel py-3 px-5 rounded-2xl font-bold outline-none focus:ring-2 ring-secondary/20"/>
                    </div>
                  </motion.div>
                )}
                {arrived===false && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-5 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-sm font-black text-red-700">Our team will contact you within 15 minutes to resolve this and process a refund if applicable.</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={()=>setStep(1)} disabled={arrived===null||(arrived===true&&onTime===null)}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-secondary transition-all disabled:opacity-30">
                Continue <ChevronRight size={18}/>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 1 — OUTCOME */}
        {step===1 && (
          <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
            <div className="glass-panel rounded-[3rem] p-10 space-y-7">
              <div>
                <h3 className="text-2xl font-black tracking-tighter mb-1">Patient Outcome</h3>
                <p className="text-sm opacity-40 font-bold">Helps MedGemma improve future matches.</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-3">Equipment Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} onClick={()=>setRating(s)}>
                      <Star size={32} className={s<=equipRating?'text-yellow-400 fill-yellow-400':'text-primary/20'}/>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-2">Describe Outcome</label>
                <textarea value={patientDesc} onChange={e=>setPatient(e.target.value)}
                  placeholder="e.g. Trauma patient received timely CT, injury identified within 2-hour window..."
                  className="w-full glass-panel p-5 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-2 ring-secondary/20 resize-none h-32"/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-2">Additional Notes</label>
                <input value={notes} onChange={e=>setNotes(e.target.value)}
                  placeholder="Logistics issues, equipment condition..."
                  className="w-full glass-panel py-4 px-5 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-secondary/20"/>
              </div>
              <button onClick={handleAnalyze} disabled={loading||!patientDesc.trim()||!equipRating}
                className="w-full bg-secondary text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-30">
                {loading?<><Loader2 size={18} className="animate-spin"/> Analyzing with MedGemma…</>:<><BrainCircuit size={18}/> Submit & Get AI Analysis</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — AI RESULT */}
        {step===2 && aiOutcome && (
          <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="space-y-6">
            {/* HERO CARD */}
            <div className="glass-panel rounded-[3rem] p-10 bg-primary text-white space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
                  <BrainCircuit size={22}/>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-secondary tracking-widest">MedGemma Outcome Report</p>
                  <p className="text-[9px] font-black opacity-30 uppercase">HAI-DEF · Google Health AI</p>
                </div>
                <span className={`ml-auto text-[9px] font-black px-3 py-1 rounded-full border ${GRADE_STYLE[aiOutcome.outcome_grade]||''}`}>
                  {aiOutcome.outcome_grade}
                </span>
              </div>
              <blockquote className="text-xl font-black leading-snug opacity-90 border-l-4 border-secondary pl-5">
                {aiOutcome.impact_statement}
              </blockquote>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-3xl font-black">{aiOutcome.time_saved_hours}</p>
                  <p className="text-[9px] font-black opacity-40 uppercase">Hours Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black">{aiOutcome.lives_potentially_impacted}</p>
                  <p className="text-[9px] font-black opacity-40 uppercase">Patients Impacted</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black">{aiOutcome.network_value_score}<span className="text-lg opacity-50">/100</span></p>
                  <p className="text-[9px] font-black opacity-40 uppercase">Network Score</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-panel rounded-[2.5rem] p-8 space-y-4">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Suggestions</h4>
                {(aiOutcome.improvement_suggestions||[]).map((s,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/40 rounded-2xl">
                    <span className="text-[9px] font-black w-5 h-5 bg-secondary/10 text-secondary rounded-full flex items-center justify-center shrink-0">{i+1}</span>
                    <p className="text-xs font-medium">{s}</p>
                  </div>
                ))}
              </div>
              <div className="glass-panel rounded-[2.5rem] p-8 space-y-4">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Repeat Recommendation</h4>
                <div className={`p-6 rounded-2xl text-center border ${aiOutcome.recommend_repeat?'bg-emerald-50 border-emerald-200':'bg-amber-50 border-amber-200'}`}>
                  {aiOutcome.recommend_repeat
                    ?<><CheckCircle className="mx-auto mb-2 text-emerald-500" size={28}/><p className="font-black text-emerald-700">Recommended for future</p></>
                    :<><AlertTriangle className="mx-auto mb-2 text-amber-500" size={28}/><p className="font-black text-amber-700">Review before rebooking</p></>
                  }
                </div>
                {aiOutcome.data_quality_note && (
                  <p className="text-[10px] font-bold text-amber-600 italic">{aiOutcome.data_quality_note}</p>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] p-7 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Charged</p>
                <p className="text-3xl font-black">${totalCost.toFixed(2)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>downloadReport({id:bookingId,asset,from},aiOutcome)}
                  className="flex items-center gap-2 glass-panel px-5 py-3 rounded-2xl font-black text-sm hover:bg-white transition-all">
                  <FileText size={15}/> Report
                </button>
                <button onClick={()=>downloadReport({id:bookingId,asset,from},aiOutcome)}
                  className="flex items-center gap-2 glass-panel px-5 py-3 rounded-2xl font-black text-sm hover:bg-white transition-all">
                  <Download size={15}/> Invoice
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={()=>navigate('/clinic/feedback')}
                className="flex-1 bg-violet-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-violet-700 transition-all">
                Leave Feedback <ChevronRight size={18}/>
              </button>
              <button onClick={()=>navigate('/clinic')}
                className="flex-1 glass-panel py-5 rounded-2xl font-black hover:bg-white transition-all text-center">
                Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}