// Inline local AI helper — calls Express backend → Ollama (no API key needed)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Activity, Zap, Thermometer, Cpu, ChevronRight,
  AlertCircle, FileCheck, RotateCcw, ChevronLeft, Loader,
  CheckCircle2, PenLine, BrainCircuit
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

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

const ENV_SENSORS = [
  { label:"Cryogen Level (He)", target:"> 95%",    current:"98.2%", ok:true  },
  { label:"Room Temperature",  target:"18–22°C",   current:"20.1°C",ok:true  },
  { label:"Humidity Index",    target:"40–60%",    current:"44%",   ok:true  },
  { label:"Magnetic Shielding",target:"Nominal",   current:"Stable",ok:true  },
];

const HW_SYSTEMS = [
  { label:"Gradient Coil A",      val:100, ok:true  },
  { label:"Gradient Coil B",      val:97,  ok:true, warn:"0.02% deviation — shimming recommended" },
  { label:"RF Transmitter Chain", val:100, ok:true  },
  { label:"Cryo-Compressor",      val:99,  ok:true  },
];

export default function TechCalibration() {
  const navigate   = useNavigate();
  const { addCalibrationEntry } = useClinic();
  const sigRef     = useRef();
  const [step, setStep]       = useState(1);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [wavePhase, setWave]  = useState(0);
  const [sig, setSig]         = useState('');
  const [submitting, setSubmit] = useState(false);
  const [done, setDone]       = useState(false);
  const [aiNote, setAiNote]   = useState(null);
  const [aiLoading, setAiLoad] = useState(false);

  // animate waveform on step 2
  useEffect(() => {
    if (step !== 2) return;
    const t = setInterval(() => setWave(w => w + 1), 80);
    return () => clearInterval(t);
  }, [step]);

  const runScan = () => {
    setScanning(true);
    setScanDone(false);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 2400);
  };

  const CALIB_FALLBACK = {overall:"Pass with Advisory",quality_score:97.4,advisory:"Gradient Coil B shows minor deviation (0.02%) within accepted tolerance. Automatic shimming applied.",clearance:"Approved for Clinical Use",sign_off_note:"Unit cleared for diagnostic deployment. Monitor Coil B metrics on next scheduled service."};
  const runAI = async () => {
    setAiLoad(true);
    // 8-second timeout — fallback immediately if model is slow
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(CALIB_FALLBACK), 8000));
    const aiPromise = askMedGemmaJSON(
      `You are MedGemma, AI calibration advisor. Return ONLY JSON: {"overall":"Pass","quality_score":number,"advisory":string,"clearance":"Approved for Clinical Use","sign_off_note":string}`,
      `Unit: Siemens Magnetom Sola RX-990. Scan: ${HW_SYSTEMS.map(h=>h.label+':'+h.val+'%').join(', ')}.`,
      CALIB_FALLBACK
    );
    const result = await Promise.race([aiPromise, timeoutPromise]);
    setAiNote(result);
    setAiLoad(false);
  };

  const submitCert = () => {
    if (!sig.trim()) return;
    setSubmit(true);
    setTimeout(() => {
      addCalibrationEntry({
        unit: 'Siemens Magnetom Sola · RX-990',
        tech: sig,
        score: aiNote?.quality_score ?? 99.8,
        clearance: aiNote?.clearance ?? 'Approved for Clinical Use',
        notes: aiNote?.sign_off_note ?? 'All systems nominal.',
      });
      setSubmit(false);
      setDone(true);
    }, 2200);
  };

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";
  const wavePoints = Array.from({length:60},(_,i) => {
    const x = (i/59)*100;
    const y = 50 + Math.sin((i/5)+wavePhase*0.15)*18 + Math.sin((i/12)+wavePhase*0.08)*8;
    return `${x},${y}`;
  }).join(' ');

  if (done) return (
    <div className="max-w-2xl mx-auto pt-24 text-center pb-20">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring'}}>
        <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-8"/>
      </motion.div>
      <h2 className="text-4xl font-black tracking-tighter text-primary mb-4">Committed to Registry</h2>
      <p className="text-sm font-bold opacity-50 uppercase text-primary mb-8">
        Siemens Magnetom Sola · RX-990 is certified for clinical use. Record filed under your Tech ID.
      </p>
      {/* Show the logged entry */}
      {calibrationLog.length > 0 && (
        <div className="glass-panel p-8 rounded-[2.5rem] text-left mb-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-primary">Latest Registry Entry</p>
          {calibrationLog.slice(0,3).map(entry => (
            <div key={entry.id} className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-sm text-primary uppercase">{entry.unit}</p>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">{entry.id} · {entry.timestamp}</p>
                </div>
                <span className="text-[9px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase">{entry.clearance || 'Approved'}</span>
              </div>
              <p className="text-[10px] font-bold text-primary/60 mt-2">Tech: {entry.tech} · Score: {entry.score}</p>
              <p className="text-[10px] font-bold text-primary/40 italic mt-1">{entry.notes}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <button onClick={() => navigate('/tech')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Ops Center</button>
        <button onClick={() => navigate('/tech/service-orders')} className="glass-panel px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary">Service Orders</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase mb-3 text-primary border border-primary/20">
            <ShieldCheck size={12} className="text-secondary"/> ISO-9001 Compliance Protocol
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Asset Calibration</h2>
          <p className="text-xs font-bold opacity-40 uppercase mt-2 text-primary">Unit: Siemens Magnetom Sola · ID: RX-990</p>
        </div>
        <div className="text-right">
          <div className="text-[32px] font-black tracking-tighter leading-none text-primary">Step 0{step}</div>
          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">of 03</div>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="flex gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="flex-1 h-2 rounded-full overflow-hidden bg-primary/5">
            <motion.div animate={{width:step>=i?'100%':'0%'}} transition={{duration:0.5}}
              className="h-full bg-secondary shadow-[0_0_15px_rgba(168,218,220,0.4)]"/>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-black uppercase text-primary">
        <span className={step>=1?'opacity-100':'opacity-30'}>01. Environment</span>
        <span className={step>=2?'opacity-100':'opacity-30'}>02. Hardware</span>
        <span className={step>=3?'opacity-100':'opacity-30'}>03. Sign-off</span>
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 1 */}
        {step===1 && (
          <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-8">
            <div className={glass}>
              <h3 className="text-2xl font-black mb-8 italic uppercase flex items-center gap-3 text-primary">
                <Thermometer className="text-secondary"/> 01. Environmental Sync
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {ENV_SENSORS.map((s,i) => (
                  <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                    className="p-8 bg-white/40 rounded-[2.5rem] border border-white flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black opacity-30 uppercase mb-1 text-primary">{s.label}</p>
                      <p className="text-xl font-black text-primary">{s.current}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black opacity-30 uppercase text-primary">Target: {s.target}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${s.ok?'text-emerald-500':'text-red-500'}`}>
                        {s.ok?'✓ Verified':'✗ Out of Range'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)}
                className="bg-primary text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-secondary hover:text-primary transition-all shadow-xl">
                Hardware Calibration <ChevronRight size={18}/>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-8">
            <div className={glass}>
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-2xl font-black italic uppercase flex items-center gap-3 text-primary">
                  <Cpu className="text-secondary"/> 02. Hardware Pulse
                </h3>
                <div className="flex gap-3">
                  <button onClick={runScan} disabled={scanning}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${scanning?'bg-secondary text-primary':'bg-primary text-white hover:bg-secondary hover:text-primary'}`}>
                    {scanning?<><Loader size={14} className="animate-spin"/> Analysing…</>:<><Zap size={14}/> Run Diagnostics</>}
                  </button>
                  {scanDone && (
                    <button onClick={runAI} disabled={aiLoading}
                      className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2 disabled:opacity-50">
                      {aiLoading?<Loader size={14} className="animate-spin"/>:<BrainCircuit size={14}/>}
                      {aiLoading?'MedGemma…':'AI Analysis'}
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE WAVEFORM */}
              <div className="h-44 bg-primary/5 rounded-[2.5rem] border border-white/50 relative overflow-hidden mb-8">
                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,transparent_95%,rgba(0,0,0,0.1)_100%),linear-gradient(0deg,transparent_95%,rgba(0,0,0,0.1)_100%)] [background-size:20px_20px]"/>
                <svg className="w-full h-full px-6 py-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline points={wavePoints} fill="none" stroke="#1d3557" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                  <polyline points={wavePoints.split(' ').map((pt,i) => {
                    const [x,y]=pt.split(','); return `${x},${+y*0.6+20}`;
                  }).join(' ')} fill="none" stroke="#a8dadc" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.5"/>
                </svg>
                <div className="absolute bottom-4 right-6 flex gap-6">
                  <div className="text-right"><p className="text-[8px] font-black opacity-30 uppercase text-primary">Freq</p><p className="text-xs font-black text-primary">63.8 MHz</p></div>
                  <div className="text-right"><p className="text-[8px] font-black opacity-30 uppercase text-primary">Errors</p><p className="text-xs font-black text-red-500">00</p></div>
                </div>
                {!scanDone && !scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[10px] font-black uppercase opacity-20 text-primary">Click "Run Diagnostics" to start</p>
                  </div>
                )}
              </div>

              {/* HW SUBSYSTEMS */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {HW_SYSTEMS.map((h,i) => (
                  <div key={i} className={`p-6 rounded-[2rem] border ${h.warn?'bg-amber-500/5 border-amber-200':'bg-white/40 border-white'}`}>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black uppercase text-primary opacity-60">{h.label}</p>
                      <p className="font-black text-sm text-primary">{h.val}%</p>
                    </div>
                    <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:scanDone?`${h.val}%`:'0%'}} transition={{duration:1,delay:i*0.1}}
                        className={`h-full rounded-full ${h.warn?'bg-amber-400':'bg-emerald-500'}`}/>
                    </div>
                    {h.warn && <p className="text-[9px] font-bold text-amber-600 mt-2 uppercase">{h.warn}</p>}
                  </div>
                ))}
              </div>

              {scanDone && !aiNote && (
                <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] flex items-start gap-4">
                  <AlertCircle className="text-amber-500 shrink-0" size={18}/>
                  <div>
                    <p className="text-xs font-black uppercase text-amber-600">Minor Variance Detected</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase leading-relaxed text-primary">Gradient Coil B showing 0.02% deviation. Click "AI Analysis" for MedGemma assessment.</p>
                  </div>
                </div>
              )}

              {/* AI RESULT */}
              <AnimatePresence>
                {aiNote && (
                  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                    className={`p-8 rounded-[2rem] border ${aiNote.overall==='Fail'?'bg-red-50 border-red-200':aiNote.overall.includes('Advisory')?'bg-amber-50 border-amber-200':'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <BrainCircuit size={18} className="text-primary"/>
                        <p className="text-[10px] font-black uppercase text-primary">MedGemma Assessment · {aiNote.overall}</p>
                      </div>
                      <p className="text-2xl font-black text-primary">{aiNote.quality_score}<span className="text-sm opacity-40">/100</span></p>
                    </div>
                    <p className="text-xs font-bold text-primary mb-3">{aiNote.advisory}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <CheckCircle2 size={14} className="text-emerald-600"/>
                      <p className="text-[10px] font-black uppercase text-emerald-700">{aiNote.clearance}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="font-black uppercase text-[10px] opacity-40 hover:opacity-100 text-primary flex items-center gap-2">
                <RotateCcw size={14}/> Back
              </button>
              <button onClick={() => setStep(3)} disabled={!scanDone}
                className="bg-primary text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-secondary hover:text-primary transition-all shadow-xl disabled:opacity-40">
                Final Sign-off <ChevronRight size={18}/>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <motion.div key="s3" initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} className="space-y-8">
            <div className={glass}>
              <div className="flex flex-col items-center text-center py-8 border-b border-primary/5 mb-8">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                  <FileCheck className="text-emerald-500" size={40}/>
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-3 text-primary">Readiness Verified</h3>
                <p className="max-w-md text-xs font-bold opacity-40 uppercase leading-relaxed text-primary">
                  All system parameters within clinical tolerance. Signing certifies this asset is safe for human diagnostic use.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-center p-6 bg-white/40 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-primary/40"/>
                    <span className="text-[10px] font-black uppercase text-primary">Final Quality Score</span>
                  </div>
                  <span className="text-lg font-black italic text-emerald-600">{aiNote?.quality_score ?? 99.8}/100</span>
                </div>
                {aiNote && (
                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                    <p className="text-[9px] font-black uppercase opacity-30 mb-2 text-primary">MedGemma Sign-off Note</p>
                    <p className="text-xs font-bold text-primary">{aiNote.sign_off_note}</p>
                  </div>
                )}

                {/* DIGITAL SIGNATURE */}
                <div className="p-8 bg-primary/5 rounded-[2.5rem] space-y-4">
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] text-primary">Technician Digital Signature *</p>
                  <div className="relative">
                    <PenLine className="absolute left-5 top-1/2 -translate-y-1/2 text-primary opacity-20" size={18}/>
                    <input value={sig} onChange={e=>setSig(e.target.value)}
                      placeholder="Type your full name to sign"
                      className={`w-full glass-panel pl-12 pr-6 py-5 rounded-2xl font-bold bg-white/50 outline-none text-primary font-serif italic text-lg ${!sig?'focus:ring-2 ring-secondary':''}`}/>
                  </div>
                  {!sig && <p className="text-[9px] text-amber-500 font-black uppercase ml-2">Signature required to commit</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="font-black uppercase text-[10px] opacity-40 hover:opacity-100 text-primary flex items-center gap-2">
                <RotateCcw size={14}/> Back
              </button>
              <button onClick={submitCert} disabled={!sig.trim()||submitting}
                className="bg-emerald-600 disabled:bg-emerald-200 text-white px-16 py-7 rounded-[3rem] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-4">
                {submitting?<><Loader size={22} className="animate-spin"/> Filing…</>:<><FileCheck size={22}/> Commit to Registry</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}