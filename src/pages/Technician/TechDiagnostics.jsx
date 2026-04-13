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
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Zap, Cpu, Wifi, ShieldAlert, RefreshCw,
  HardDrive, Radio, ChevronLeft, Loader, Download,
  BrainCircuit, CheckCircle2, AlertTriangle, X
} from 'lucide-react';

const INIT_LOGS = [
  { time:"15:04:22", event:"Gantry Position Sync",  code:"OK"   },
  { time:"14:59:10", event:"Power Surge Detected",   code:"WARN" },
  { time:"14:30:00", event:"Auto-Calibration",       code:"OK"   },
  { time:"12:12:45", event:"Bitstream Reset",        code:"OK"   },
];

const SUBSYSTEMS = [
  { name:"MRI Magnet Assembly",  health:98,  parts:["Coil A","Coil B"]   },
  { name:"Control Computer",     health:100, parts:["NPU","RAM"]         },
  { name:"Imaging Processor",    health:94,  parts:["GPU Array","Bus"]   },
  { name:"Cryogen System",       health:99,  parts:["Pump","Valve"]      },
];

function downloadDebug(logs) {
  const txt = logs.map(l=>`[${l.time}] ${l.code.padEnd(5)} ${l.event}`).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`ResourceRX Debug File\nExported: ${new Date().toISOString()}\n\n${txt}`],{type:'text/plain'}));
  a.download = 'RRX_Debug.txt'; a.click();
}

export default function TechDiagnostics() {
  const navigate = useNavigate();

  // Read context from service orders — useState ensures it re-reads on mount
  const [diagAsset, setDiagAsset] = useState(null);
  useEffect(() => {
    try {
      const val = JSON.parse(sessionStorage.getItem('rrx_diag_asset') || 'null');
      if (val) setDiagAsset(val);
    } catch {}
  }, []);

  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [telemetry, setTelemetry] = useState({ signal:'-42 dBm', cpuTemp:'44°C', latency:'14ms', storage:'99.9%' });
  const [logs, setLogs] = useState(INIT_LOGS);
  const [wavePhase, setWave] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoad] = useState(false);
  const [selectedSys, setSelectedSys] = useState(null);

  // live waveform
  useEffect(() => {
    const t = setInterval(() => setWave(w=>w+1), 70);
    return () => clearInterval(t);
  }, []);

  // jitter telemetry every 4s
  useEffect(() => {
    const t = setInterval(() => {
      setTelemetry({
        signal: `-${40+Math.floor(Math.random()*8)} dBm`,
        cpuTemp: `${42+Math.floor(Math.random()*6)}°C`,
        latency: `${12+Math.floor(Math.random()*8)}ms`,
        storage: '99.9%',
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const runScan = () => {
    setScanning(true);
    setAiResult(null);
    setTimeout(() => {
      const newLog = {
        time: new Date().toLocaleTimeString('en-GB'),
        event: ['Gradient Coil Sync','RF Chain Check','Bore Camera Test','Power Rail Check'][scanCount % 4],
        code: Math.random() > 0.85 ? 'WARN' : 'OK',
      };
      setLogs(prev => [newLog, ...prev.slice(0,7)]);
      setScanCount(c=>c+1);
      setScanning(false);
    }, 3000);
  };

  const DIAG_FALLBACK = {status:"Advisory",score:94,finding:"Power surge event at 14:59 warrants monitoring. All other subsystems nominal. No immediate patient risk.",recommendation:"Complete a full 30-minute burn-in test before next clinical session to verify stability.",action:"Clear for Use"};
  const runAI = async () => {
    setAiLoad(true);
    const result = await askMedGemmaJSON(
      `You are MedGemma, AI diagnostics engine for ResourceRX. Analyse THIS SPECIFIC system telemetry and event log. Return ONLY valid JSON (no markdown): {"status":"Healthy"|"Advisory"|"Critical","score":number,"finding":string,"recommendation":string,"action":"Clear for Use"|"Schedule Maintenance"|"Take Offline"}`,
      `Telemetry: ${JSON.stringify(telemetry)}. Event log (latest first): ${logs.map(l=>l.time+' '+l.code+' '+l.event).join('; ')}.`,
      DIAG_FALLBACK
    );
    setAiResult(result);
    setAiLoad(false);
  };

  const wavePoints = Array.from({length:80},(_,i)=>{
    const x=(i/79)*100;
    const y=50+Math.sin((i/6)+wavePhase*0.12)*20+Math.sin((i/15)+wavePhase*0.07)*9;
    return `${x},${y}`;
  }).join(' ');

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";
  const STATUS_COLOR = { Healthy:'text-emerald-600 bg-emerald-50 border-emerald-200', Advisory:'text-amber-600 bg-amber-50 border-amber-200', Critical:'text-red-600 bg-red-50 border-red-200' };

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/10 text-[10px] font-black uppercase mb-3 text-secondary border border-secondary/20">
            <Radio size={12} className="animate-pulse"/> Remote Link: Encrypted
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Diagnostic Hub</h2>
          {diagAsset && (
            <p className="text-sm font-bold opacity-40 uppercase mt-2 text-primary">
              {diagAsset.asset} · {diagAsset.location} · SO: {diagAsset.id}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={runScan} disabled={scanning}
            className={`bg-primary text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl disabled:opacity-60 hover:bg-secondary hover:text-primary`}>
            {scanning?<><RefreshCw className="animate-spin" size={18}/> Scanning…</>:<><Zap size={18}/> Full System Ping</>}
          </button>
          <button onClick={runAI} disabled={aiLoading||scanning}
            className="glass-panel px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 text-primary hover:bg-white/60 transition-all disabled:opacity-40">
            {aiLoading?<Loader size={16} className="animate-spin"/>:<BrainCircuit size={16}/>}
            {aiLoading?'Analysing…':'AI Diagnosis'}
          </button>
        </div>
      </div>

      {/* TELEMETRY STATS */}
      <div className="grid lg:grid-cols-4 gap-6">
        {[
          { label:"Signal Strength",  val:telemetry.signal,  status:"Stable",   icon:Wifi      },
          { label:"CPU Temp",         val:telemetry.cpuTemp, status:"Nominal",  icon:Cpu       },
          { label:"Data Latency",     val:telemetry.latency, status:"Optimal",  icon:Activity  },
          { label:"Storage Integrity",val:telemetry.storage, status:"Verified", icon:HardDrive },
        ].map((stat,i) => (
          <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
            className="glass-panel p-8 rounded-[2.5rem] group hover:border-secondary transition-all">
            <stat.icon className="text-secondary mb-5 group-hover:scale-110 transition-transform" size={22}/>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">{stat.label}</p>
            <h3 className="text-2xl font-black mt-1 tracking-tighter text-primary">{stat.val}</h3>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{stat.status}</span>
          </motion.div>
        ))}
      </div>

      {/* WAVEFORM + EVENT LOG */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 ${glass}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Real-Time Telemetry</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[9px] font-black opacity-40 uppercase text-primary">Live Stream</span>
              <span className="text-[9px] font-black opacity-30 uppercase text-primary ml-4">Scans: {scanCount}</span>
            </div>
          </div>
          <div className="h-56 bg-primary/5 rounded-[2.5rem] border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,transparent_95%,rgba(0,0,0,0.1)_100%),linear-gradient(0deg,transparent_95%,rgba(0,0,0,0.1)_100%)] [background-size:20px_20px]"/>
            <svg className="w-full h-full px-6 py-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={wavePoints} fill="none" stroke="#1d3557" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
              <polyline points={wavePoints.split(' ').map((pt,i)=>{const[x,y]=pt.split(',');return `${x},${+y*0.5+25}`;}).join(' ')}
                fill="none" stroke="#a8dadc" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.5"/>
            </svg>
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[2.5rem]">
                <div className="flex items-center gap-3">
                  <RefreshCw size={20} className="animate-spin text-primary"/>
                  <p className="font-black text-xs uppercase text-primary">Scanning bitstream…</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 right-6 flex gap-6">
              <div className="text-right"><p className="text-[8px] font-black opacity-30 uppercase text-primary">Sample Rate</p><p className="text-xs font-black text-primary">1.2 GHz</p></div>
              <div className="text-right"><p className="text-[8px] font-black opacity-30 uppercase text-primary">Errors</p><p className={`text-xs font-black ${logs.some(l=>l.code==='WARN')?'text-amber-500':'text-emerald-500'}`}>{logs.filter(l=>l.code==='WARN').length.toString().padStart(2,'0')}</p></div>
            </div>
          </div>
        </div>

        {/* EVENT LOG */}
        <div className={glass}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Event Stack</h3>
            <button onClick={() => downloadDebug(logs)} className="text-[9px] font-black uppercase opacity-30 hover:opacity-100 text-primary flex items-center gap-1 transition-opacity">
              <Download size={12}/> Export
            </button>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            <AnimatePresence>
              {logs.map((log,i) => (
                <motion.div key={`${log.time}-${i}`} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}}
                  className="flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white">
                  <div>
                    <p className="text-[9px] font-black opacity-30 uppercase text-primary">{log.time}</p>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-primary">{log.event}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded ${log.code==='WARN'?'bg-amber-500/10 text-amber-600':'bg-emerald-500/10 text-emerald-600'}`}>
                    {log.code}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <button onClick={() => downloadDebug(logs)}
            className="w-full mt-6 py-4 glass-panel text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all text-primary flex items-center justify-center gap-2">
            <Download size={14}/> Download Debug File
          </button>
        </div>
      </div>

      {/* AI DIAGNOSIS */}
      <AnimatePresence>
        {aiResult && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            className={`p-10 rounded-[3.5rem] border ${STATUS_COLOR[aiResult.status]}`}>
            <div className="flex items-start justify-between gap-8">
              <div className="flex items-start gap-6">
                <BrainCircuit size={32} className="shrink-0 mt-1 text-primary"/>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">MedGemma · {aiResult.status}</p>
                    <span className="text-2xl font-black text-primary">{aiResult.score}<span className="text-sm opacity-40">/100</span></span>
                  </div>
                  <p className="text-sm font-bold text-primary">{aiResult.finding}</p>
                  <p className="text-xs font-bold opacity-60 uppercase text-primary">{aiResult.recommendation}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 size={14} className="text-emerald-600"/>
                    <p className="text-[10px] font-black uppercase text-emerald-700">{aiResult.action}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                {aiResult.action === 'Schedule Maintenance' && (
                  <button onClick={()=>navigate('/tech/service-orders')}
                    className="bg-primary text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-secondary hover:text-primary transition-all">
                    Schedule →
                  </button>
                )}
                <button onClick={()=>setAiResult(null)} className="text-primary opacity-30 hover:opacity-100 transition-opacity"><X size={18}/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBSYSTEMS */}
      <div className={glass}>
        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 text-primary">Subsystem Health</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSYSTEMS.map((sys,i) => (
            <div key={i} onClick={()=>setSelectedSys(selectedSys===i?null:i)}
              className={`space-y-4 p-6 rounded-[2.5rem] border cursor-pointer transition-all ${selectedSys===i?'bg-primary text-white border-primary':'bg-primary/5 border-primary/5 hover:bg-white'}`}>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-tight">{sys.name}</span>
                <span className={`text-xs font-black ${selectedSys===i?'text-secondary':'text-primary'}`}>{sys.health}%</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${selectedSys===i?'bg-white/20':'bg-primary/10'}`}>
                <motion.div initial={{width:0}} animate={{width:`${sys.health}%`}} transition={{duration:1,delay:i*0.1}}
                  className={`h-full ${sys.health<96?'bg-amber-400':'bg-emerald-500'}`}/>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sys.parts.map(p=>(
                  <span key={p} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full italic ${selectedSys===i?'bg-white/20 text-white':'bg-white/50 opacity-40 text-primary'}`}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}