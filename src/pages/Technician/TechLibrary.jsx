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
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Library, FileText, Search, Download, Eye, BookOpen,
  Cpu, ShieldCheck, Zap, Bookmark, Share2, ChevronLeft,
  BrainCircuit, Loader, X, CheckCircle2, MessageSquare
} from 'lucide-react';

const DOCUMENTS = [
  { id:1, title:"Siemens Magnetom Service Manual", version:"v8.2",  type:"Full Manual", size:"42MB", category:"MRI",         tags:["magnet","coil","calibration"]   },
  { id:2, title:"GE Revolution CT Schematics",    version:"v12.0", type:"Circuit Map", size:"12MB", category:"CT",          tags:["gantry","tube","power"]         },
  { id:3, title:"Quench Emergency Protocol",       version:"2025",  type:"Safety SOP",  size:"2MB",  category:"Safety",      tags:["quench","MRI","emergency"]      },
  { id:4, title:"Cryogen Refill Step-by-Step",    version:"v3.1",  type:"SOP",         size:"8MB",  category:"Maintenance", tags:["helium","cryo","valve"]         },
  { id:5, title:"MRI Suite Shielding Standards",  version:"v2.0",  type:"Standard",    size:"5MB",  category:"MRI",         tags:["RF shield","room","compliance"] },
  { id:6, title:"CT Tube Replacement Protocol",   version:"v4.4",  type:"Procedure",   size:"18MB", category:"CT",          tags:["tube","replacement","cooling"]  },
];

const CATS = [
  { label:"MRI Systems", count:"142 Docs", icon:Zap,       key:"MRI"         },
  { label:"CT Hardware", count:"88 Docs",  icon:Cpu,       key:"CT"          },
  { label:"Safety SOPs", count:"12 Docs",  icon:ShieldCheck,key:"Safety"     },
  { label:"Maintenance", count:"24 Docs",  icon:Bookmark,   key:"Maintenance" },
];

function downloadDoc(doc) {
  const txt = `ResourceRX Technical Library\n\nTitle: ${doc.title}\nVersion: ${doc.version}\nType: ${doc.type}\nCategory: ${doc.category}\n\nThis document has been downloaded from the ResourceRX field knowledge base.`;
  const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'})); a.download=`${doc.title.replace(/\s+/g,'_')}.txt`; a.click();
}

export default function TechLibrary() {
  const navigate = useNavigate();
  const [query,      setQuery]    = useState('');
  const [catFilter,  setCatFilter]= useState('All');
  const [bookmarked, setBookmark] = useState([1,3]);
  const [aiQuery,    setAiQuery]  = useState('');
  const [aiAnswer,   setAiAnswer] = useState(null);
  const [aiLoading,  setAiLoad]   = useState(false);
  const [viewing,    setViewing]  = useState(null);

  const filtered = useMemo(() => DOCUMENTS.filter(d => {
    const q = query.toLowerCase();
    const matchQ = !q || d.title.toLowerCase().includes(q) || d.tags.some(t=>t.includes(q)) || d.category.toLowerCase().includes(q);
    const matchC = catFilter==='All' || d.category===catFilter;
    return matchQ && matchC;
  }), [query, catFilter]);

  const askAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoad(true); setAiAnswer(null);
    const answer = await askMedGemmaText(
      "You are MedGemma, AI technical advisor for ResourceRX field technicians. Answer practical equipment maintenance and repair questions directly and concisely. Use numbered steps where relevant. Reference real medical imaging equipment specifications where applicable.",
      aiQuery,
      "MedGemma temporarily offline. Cross-reference the relevant SOP from your downloaded documents. For critical issues, contact Command Link."
    );
    setAiAnswer(answer);
    setAiLoad(false);
  };

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/tech')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Ops Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase mb-3 text-primary border border-primary/20">
            <Library size={12} className="text-secondary"/> Knowledge Protocol 11-A
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Technical Library</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 text-primary" size={16}/>
          <input type="text" value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search manuals, SOPs, or codes..."
            className="glass-panel pl-14 pr-10 py-4 rounded-3xl font-bold text-xs outline-none w-80 text-primary focus:ring-2 ring-secondary/50 transition-all"/>
          {query && <button onClick={()=>setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"><X size={14} className="text-primary"/></button>}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="grid md:grid-cols-4 gap-6">
        {CATS.map((cat,i) => (
          <motion.div key={i} whileHover={{y:-4}} onClick={()=>setCatFilter(catFilter===cat.key?'All':cat.key)}
            className={`glass-panel p-8 rounded-[2.5rem] text-center cursor-pointer group transition-all ${catFilter===cat.key?'bg-primary text-white border-primary':'border-white/40'}`}>
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${catFilter===cat.key?'bg-white/20 text-secondary':'bg-primary/5 text-primary group-hover:text-secondary'}`}>
              <cat.icon size={28}/>
            </div>
            <p className={`text-xs font-black uppercase tracking-tight ${catFilter===cat.key?'text-white':'text-primary'}`}>{cat.label}</p>
            <p className={`text-[9px] font-bold uppercase mt-1 ${catFilter===cat.key?'text-secondary':'opacity-30 text-primary'}`}>{cat.count}</p>
          </motion.div>
        ))}
      </div>

      {/* MEDGEMMA ASK */}
      <div className={glass}>
        <div className="flex items-center gap-4 mb-6">
          <BrainCircuit className="text-secondary" size={24}/>
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Ask MedGemma</h3>
          <span className="text-[9px] font-black uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">AI Technical Advisor</span>
        </div>
        <div className="flex gap-3">
          <input value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askAI()}
            placeholder="e.g. How do I perform a gradient coil shimming procedure?"
            className="flex-1 glass-panel px-8 py-5 rounded-3xl font-bold text-sm bg-white/50 outline-none text-primary focus:ring-2 ring-secondary"/>
          <button data-ask-btn onClick={askAI} disabled={!aiQuery.trim()||aiLoading}
            className="bg-primary text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all disabled:opacity-40 flex items-center gap-2">
            {aiLoading?<Loader size={14} className="animate-spin"/>:<MessageSquare size={14}/>}
            {aiLoading?'Asking…':'Ask'}
          </button>
        </div>
        <AnimatePresence>
          {aiAnswer && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mt-6 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 relative">
              <button onClick={()=>setAiAnswer(null)} className="absolute top-4 right-4 opacity-20 hover:opacity-100"><X size={14} className="text-primary"/></button>
              <p className="text-[9px] font-black uppercase opacity-40 mb-3 text-primary">MedGemma Response</p>
              <p className="text-sm font-bold text-primary leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DOCUMENT ARCHIVE */}
      <div className={glass}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary flex items-center gap-3">
            <BookOpen className="text-secondary"/> OEM Archives
          </h3>
          <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] text-primary">
            {filtered.length} / {DOCUMENTS.length} shown
          </span>
        </div>

        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((doc,i) => (
              <motion.div key={doc.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{delay:i*0.06}}
                className="group flex flex-col md:flex-row md:items-center justify-between p-8 bg-white/40 rounded-[2.5rem] border border-white hover:bg-white transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary/20 border border-primary/5">
                    <FileText size={24}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-black text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded-full">{doc.category}</span>
                      <span className="text-[9px] font-black opacity-30 uppercase tracking-widest text-primary">{doc.version}</span>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight leading-none text-primary">{doc.title}</h4>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {doc.tags.map(t=><span key={t} className="text-[8px] font-black opacity-20 uppercase text-primary">#{t}</span>)}
                    </div>
                    <p className="text-[10px] font-bold opacity-40 uppercase mt-1 text-primary">{doc.type} · {doc.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6 md:mt-0">
                  <button onClick={()=>setViewing(viewing===doc.id?null:doc.id)}
                    className={`p-4 rounded-2xl shadow-sm hover:scale-110 transition-all ${viewing===doc.id?'bg-primary text-white':'bg-white text-primary/40 hover:text-secondary'}`}>
                    <Eye size={20}/>
                  </button>
                  <button onClick={()=>downloadDoc(doc)} className="p-4 bg-white rounded-2xl shadow-sm text-primary/40 hover:text-secondary hover:scale-110 transition-all">
                    <Download size={20}/>
                  </button>
                  <button onClick={()=>setBookmark(prev=>prev.includes(doc.id)?prev.filter(b=>b!==doc.id):[...prev,doc.id])}
                    className={`p-4 rounded-2xl shadow-sm hover:scale-110 transition-all ${bookmarked.includes(doc.id)?'bg-secondary text-primary':'bg-white text-primary/40 hover:text-secondary'}`}>
                    <Bookmark size={20}/>
                  </button>
                </div>
                {/* PREVIEW */}
                <AnimatePresence>
                  {viewing===doc.id && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                      className="w-full mt-6 overflow-hidden">
                      <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <p className="text-[9px] font-black uppercase opacity-30 mb-3 text-primary">Document Preview · {doc.title}</p>
                        <p className="text-xs font-bold text-primary opacity-60 leading-relaxed">
                          {doc.type === 'Safety SOP' ? 'STEP 1: On detection of rapid pressure loss in the cryogen vessel, activate the emergency stop. STEP 2: Evacuate all personnel from the scan room immediately. STEP 3: Open the quench pipe vent manually from the external panel...' :
                           doc.type === 'Full Manual' ? 'Section 4.2 — Gradient System Calibration. The gradient amplifier must be calibrated after every 500 scan hours or upon replacement of the gradient coil assembly. Connect test load to AMP-OUT connector. Set waveform generator to 1kHz sine...' :
                           `${doc.title} — ${doc.version}. This document covers procedures for ${doc.tags.join(', ')}. Follow all safety guidelines as specified in the ResourceRX Protocol Framework before proceeding with any service activity.`}
                        </p>
                        <button onClick={()=>downloadDoc(doc)}
                          className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-secondary hover:opacity-70 transition-opacity">
                          <Download size={14}/> Download Full Document
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length===0 && (
            <div className="py-12 text-center opacity-30"><Search size={32} className="text-primary mx-auto mb-3"/><p className="font-black uppercase text-primary">No documents match your search</p></div>
          )}
        </div>
      </div>

      {/* FIELD INTELLIGENCE */}
      <div className={`${glass} bg-secondary text-primary border-none`}>
        <div className="flex items-start gap-8">
          <div className="shrink-0 p-5 bg-white/20 rounded-3xl"><Zap size={32}/></div>
          <div className="space-y-3">
            <h4 className="text-2xl font-black italic uppercase tracking-tighter">Field Intelligence Alert</h4>
            <p className="text-sm font-bold opacity-80 leading-relaxed uppercase">Technicians in the Northwest report that Siemens v8.2 software may hang during gantry reset if room temp is above 21°C.
              <span className="block mt-2 font-black">Recommended: Pre-cool suite to 19°C before update.</span>
            </p>
            <button onClick={async ()=>{
              const q = "What should I do if the Siemens v8.2 gantry hangs during reset in a warm room?";
              setAiQuery(q);
              // Directly call AI — don't rely on querySelector
              setAiLoad(true);
              setAiResult(null);
              try {
                const res = await fetch('http://localhost:5000/api/medgemma', {
                  method:'POST', headers:{'Content-Type':'application/json'},
                  body: JSON.stringify({ prompt: `You are a senior medical equipment engineer. Answer concisely and practically.\n\nQuestion: ${q}\n\nAnswer:` }),
                });
                const data = await res.json();
                setAiResult(data.response || 'Check coolant loop temperature and reset gantry from service mode.');
              } catch { setAiResult('Ensure room temp below 20°C, then restart gantry from service mode (hold CTRL+R at boot).'); }
              setAiLoad(false);
            }}
              className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 border-primary pb-1 hover:opacity-70 transition-opacity">
              Ask MedGemma about this →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}