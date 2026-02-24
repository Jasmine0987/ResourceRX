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
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Zap, Activity, ArrowUpRight,
  ArrowDownRight, Target, ShieldCheck, BrainCircuit,
  Download, Loader, ChevronLeft, CheckCircle2
} from 'lucide-react';


// ─── Rich, DIFFERENT data per range ───────────────────────────────────────────
const RANGES = {
  '7D': {
    data:   [42, 68, 55, 90, 77, 88, 62],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    peak: 90, avg: 69, description: 'Last 7 days · Daily Revenue ($k)',
    stats: { yield: '$12,400', change: '+8.2%', uptime: '99.1%', demand: 'Medium', maint: '88/100' },
  },
  '1M': {
    data:   [30,45,55,60,40,70,80,65,90,75,85,55,70,80,95,60,72,88,45,78,92,68,84,100,72,60,88,74,92,65],
    labels: Array.from({length:30},(_,i)=>`D${i+1}`),
    peak: 100, avg: 73, description: 'Last 30 days · Daily Revenue ($k)',
    stats: { yield: '$42,800', change: '+12.4%', uptime: '99.4%', demand: 'High', maint: '82/100' },
  },
  '1Y': {
    data:   [60, 75, 55, 80, 90, 100, 95, 88, 70, 65, 78, 92],
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    peak: 100, avg: 79, description: '2025 · Monthly Revenue ($k)',
    stats: { yield: '$428,000', change: '+19.1%', uptime: '98.7%', demand: 'High', maint: '79/100' },
  },
  'ALL': {
    data:   [28, 40, 52, 65, 78, 95],
    labels: ['2020','2021','2022','2023','2024','2025'],
    peak: 95, avg: 60, description: 'All-time · Yearly Revenue ($k)',
    stats: { yield: '$2.1M', change: '+240%', uptime: '97.8%', demand: 'Critical', maint: '75/100' },
  },
};

// ─── Briefing fallbacks differ per range ──────────────────────────────────────
const BRIEFING_FALLBACK = {
  '7D': { headline:"Short-term momentum strong — weekend dip expected Monday recovery.",revenue_insight:"Daily revenue averaged $69k, Thursday peak at $90k driven by MRI surge pricing.",utilization_insight:"Dialysis units under-utilized mid-week. CT shows consistent demand.",top_recommendation:"Activate +15% weekend pricing on MRI units — demand signals show elasticity.",risk_flag:"Battery backup for Unit #3 due for inspection within 48h.","30d_projection_usd":138000,efficiency_score:82 },
  '1M': { headline:"Fleet performing above network average with strong quarterly momentum.",revenue_insight:"Revenue grew 12.4% this period driven by high MRI utilization in Northeast.",utilization_insight:"Average utilization 87% — CT Scanner has room for yield optimization.",top_recommendation:"Relocate Unit #08 MRI to Florida to capture projected 25% seasonal premium.",risk_flag:"Liability Insurance Rider expires in 30 days — renew to avoid suspension.","30d_projection_usd":142800,efficiency_score:87 },
  '1Y': { headline:"Best annual performance on record — expand fleet by Q1 next year.",revenue_insight:"2025 annual revenue $428k — 19% above 2024. June–August peak season drove 35% of total.",utilization_insight:"92% annual utilization well above 80% target. Zero idle asset days in Q3.",top_recommendation:"Add 2 MRI units and 1 CT Scanner before peak season to capture unmet demand.",risk_flag:"3 assets due for comprehensive maintenance overhaul before year-end.","30d_projection_usd":168000,efficiency_score:93 },
  'ALL': { headline:"ResourceRX network has 240% revenue growth since onboarding — institutional-grade asset.",revenue_insight:"Compound annual revenue growth of 28% — outpacing industry 3x. Fleet valuation up 180%.",utilization_insight:"Near-zero idle time across all years. Equipment consistently in demand across 6+ hospital networks.",top_recommendation:"Institutional expansion recommended. Current fleet capacity is limiting revenue ceiling.",risk_flag:"Older units (2020 cohort) approaching end of serviceable life — plan replacement cycle.","30d_projection_usd":195000,efficiency_score:97 },
};

function downloadCSV(range) {
  const { data, labels } = RANGES[range];
  const csv = ['Period,Revenue_k,Utilization_pct', ...data.map((v,i) => `${labels[i]},$${v}k,${Math.round(v*0.87)}%`)].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = `ResourceRX_Analytics_${range}.csv`;
  a.click();
}

export default function OwnerAnalytics() {
  const navigate = useNavigate();
  const [range,     setRange]    = useState('1Y');
  const [aiLoading, setAiLoad]   = useState(false);
  const [briefing,  setBriefing] = useState(null);
  const [hovered,   setHovered]  = useState(null);

  const { data, labels, peak, avg, description, stats } = RANGES[range];

  const runBriefing = async () => {
    setAiLoad(true); setBriefing(null);
    const result = await askMedGemmaJSON(
      `You are MedGemma, AI analytics engine for ResourceRX owner fleet management. Return ONLY valid JSON:
{"headline":string,"revenue_insight":string,"utilization_insight":string,"top_recommendation":string,"risk_flag":string,"30d_projection_usd":number,"efficiency_score":number}`,
      `Fleet: 12 assets. Period: ${range}. Stats: ${JSON.stringify(stats)}. Revenue data points: ${data.map((v,i)=>`${labels[i]}:$${v}k`).join(', ')}. Avg monthly: $${avg}k. Peak: $${peak}k.`,
      BRIEFING_FALLBACK[range]
    );
    setBriefing(result);
    setAiLoad(false);
  };

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  // For chart display limit to 30 bars max for readability
  const displayData   = data.length > 30 ? data : data;
  const displayLabels = labels;
  const step = data.length > 15 ? Math.ceil(data.length / 12) : 1;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 pt-6">

      {/* HEADER */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <button onClick={()=>navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Control Center
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4 text-primary">
            <BrainCircuit size={14} className="text-secondary"/> AI-Driven Insights
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic text-primary">Asset Intelligence</h2>
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex gap-2 bg-white/40 p-2 rounded-3xl">
            {['7D','1M','1Y','ALL'].map(r => (
              <button key={r} onClick={()=>{setRange(r);setBriefing(null);}}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${r===range?'bg-primary text-white shadow':'opacity-40 text-primary hover:opacity-100'}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={()=>downloadCSV(range)}
            className="glass-panel px-5 py-3 rounded-2xl text-[10px] font-black text-primary hover:bg-white/60 flex items-center gap-2 transition-all">
            <Download size={12}/> Export {range}
          </button>
        </div>
      </div>

      {/* KPI CARDS — change with range */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          {label:"Net Yield",    val:stats.yield,  change:stats.change, up:true,  icon:TrendingUp,  route:'/owner/settlements'},
          {label:"Uptime Rate",  val:stats.uptime, change:"+0.2%",      up:true,  icon:Activity,    route:'/owner/dispatch'  },
          {label:"Demand",       val:stats.demand, change:"Tier-1",     up:true,  icon:Target,      route:'/owner/yield'     },
          {label:"Maint. Index", val:stats.maint,  change:"-4pts",      up:false, icon:ShieldCheck, route:'/owner/vault'     },
        ].map((s,i) => (
          <motion.div key={`${range}-${i}`} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
            onClick={()=>navigate(s.route)}
            className="glass-panel p-8 rounded-[2.5rem] cursor-pointer hover:scale-[1.02] transition-all group">
            <s.icon className="text-secondary mb-5 group-hover:scale-110 transition-transform" size={22}/>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">{s.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <h3 className="text-2xl font-black tracking-tighter text-primary">{s.val}</h3>
              <span className={`text-[10px] font-bold mb-1 flex items-center ${s.up?'text-emerald-500':'text-red-500'}`}>
                {s.up?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>} {s.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── PERFORMANCE MATRIX CHART ── */}
        <div className={`lg:col-span-2 ${glass}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary">Performance Matrix</h3>
              <p className="text-xs font-bold opacity-40 uppercase text-primary">{description}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black opacity-30 uppercase text-primary">Peak</p>
              <p className="text-xl font-black text-secondary">${peak}k</p>
            </div>
          </div>

          {/* Bar chart — pixel heights to ensure visibility */}
          <div className="h-56 flex items-end justify-between gap-px px-1" style={{height:'14rem'}}>
            {displayData.map((h, i) => {
              const pxHeight = Math.max(6, Math.round((h / peak) * 196)); // 196px = 14rem - 12px padding
              return (
                <div key={`${range}-bar-${i}`}
                  className="flex-1 flex flex-col items-end justify-end group cursor-pointer relative"
                  onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
                  style={{ minWidth: data.length > 20 ? '2px' : '6px' }}>
                  {hovered===i && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] font-black py-1 px-2 rounded whitespace-nowrap z-10">
                      ${h}k
                    </div>
                  )}
                  <motion.div
                    key={`${range}-b-${i}`}
                    initial={{height:0}}
                    animate={{height: pxHeight}}
                    transition={{duration:0.5, delay:i*0.015}}
                    className={`w-full rounded-t-lg ${hovered===i?'bg-secondary':'bg-gradient-to-t from-primary to-secondary/60'}`}
                    style={{minHeight:'4px'}}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between mt-3 px-1 overflow-hidden">
            {displayLabels.filter((_,i) => i % step === 0).map((l,i) => (
              <span key={i} className="text-[8px] font-black opacity-30 uppercase text-primary">{l}</span>
            ))}
          </div>

          {/* Summary row */}
          <div className="mt-6 flex gap-6 pt-4 border-t border-primary/5">
            <div><p className="text-[9px] font-black opacity-30 uppercase text-primary">Average</p><p className="font-black text-primary">${avg}k</p></div>
            <div><p className="text-[9px] font-black opacity-30 uppercase text-primary">Peak</p><p className="font-black text-secondary">${peak}k</p></div>
            <div><p className="text-[9px] font-black opacity-30 uppercase text-primary">Data Points</p><p className="font-black text-primary">{data.length}</p></div>
            <div><p className="text-[9px] font-black opacity-30 uppercase text-primary">Period</p><p className="font-black text-primary">{range}</p></div>
          </div>
        </div>

        {/* LIVE TELEMETRY */}
        <div className={glass}>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase text-primary">
            <Zap className="text-secondary"/> Live Telemetry
          </h3>
          <div className="space-y-6">
            {[
              {label:"Magnet Cooling",  status:"Optimal", val:98,  color:"bg-emerald-500"},
              {label:"CT Tube Load",    status:"Heavy",   val:74,  color:"bg-amber-500"  },
              {label:"Power Stability", status:"Steady",  val:100, color:"bg-emerald-500"},
              {label:"SW Latency",      status:"Nominal", val:88,  color:"bg-emerald-500"},
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase text-primary">{item.label}</p>
                    <p className="text-[9px] opacity-30 uppercase text-primary">{item.status}</p>
                  </div>
                  <p className="font-black text-sm text-primary">{item.val}%</p>
                </div>
                <div className="h-2 bg-primary/5 rounded-full overflow-hidden">
                  <motion.div initial={{width:0}} animate={{width:`${item.val}%`}} transition={{duration:1.2,delay:i*0.15}}
                    className={`h-full ${item.color} rounded-full`}/>
                </div>
              </div>
            ))}
          </div>
          <button onClick={()=>downloadCSV(range)}
            className="w-full mt-8 py-5 bg-primary/5 rounded-3xl border border-primary/10 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all text-primary flex items-center justify-center gap-2">
            <Download size={14}/> Export {range} Report
          </button>
        </div>
      </div>

      {/* MEDGEMMA EXECUTIVE BRIEFING */}
      <div className={glass}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary flex items-center gap-3">
              <BrainCircuit className="text-secondary" size={24}/> MedGemma Executive Briefing
            </h3>
            <p className="text-[10px] font-bold opacity-30 uppercase mt-1 text-primary">Analysis for period: {range}</p>
          </div>
          <button onClick={runBriefing} disabled={aiLoading}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-secondary hover:text-primary transition-all disabled:opacity-50">
            {aiLoading?<><Loader size={14} className="animate-spin"/> Analysing…</>:<><BrainCircuit size={14}/> Generate Briefing</>}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!briefing && !aiLoading && (
            <div className="py-12 text-center opacity-30">
              <BrainCircuit size={40} className="text-primary mx-auto mb-4"/>
              <p className="font-black uppercase text-[10px] text-primary">Select a period and click "Generate Briefing" for AI fleet intelligence</p>
            </div>
          )}
          {aiLoading && (
            <div className="py-12 text-center">
              <Loader size={40} className="text-secondary animate-spin mx-auto mb-4"/>
              <p className="font-black uppercase text-[10px] text-primary opacity-40">MedGemma analysing {range} fleet data…</p>
            </div>
          )}
          {briefing && !aiLoading && (
            <motion.div key={`briefing-${range}`} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-6">
              <blockquote className="text-2xl font-black tracking-tighter text-primary border-l-4 border-secondary pl-6 italic leading-snug">
                {briefing.headline}
              </blockquote>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black uppercase text-emerald-600 mb-2">30-Day Projection</p>
                  <p className="text-3xl font-black text-emerald-700">${briefing['30d_projection_usd']?.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-secondary/10 rounded-2xl border border-secondary/20">
                  <p className="text-[9px] font-black uppercase text-primary/60 mb-2">Efficiency Score</p>
                  <p className="text-3xl font-black text-primary">{briefing.efficiency_score}<span className="text-lg opacity-40">/100</span></p>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[9px] font-black uppercase text-amber-600 mb-2">Risk Flag</p>
                  <p className="text-xs font-bold text-amber-700">{briefing.risk_flag}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/50 rounded-2xl border border-white">
                  <p className="text-[9px] font-black uppercase opacity-40 mb-2 text-primary">Revenue Insight</p>
                  <p className="text-sm font-bold text-primary">{briefing.revenue_insight}</p>
                </div>
                <div className="p-6 bg-white/50 rounded-2xl border border-white">
                  <p className="text-[9px] font-black uppercase opacity-40 mb-2 text-primary">Utilisation Insight</p>
                  <p className="text-sm font-bold text-primary">{briefing.utilization_insight}</p>
                </div>
              </div>
              <div className="p-6 bg-primary rounded-2xl text-white flex items-center gap-4 flex-wrap">
                <CheckCircle2 className="text-secondary shrink-0" size={20}/>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase opacity-60 mb-1">Top Recommendation</p>
                  <p className="text-sm font-bold">{briefing.top_recommendation}</p>
                </div>
                <button onClick={()=>navigate('/owner/yield')}
                  className="ml-auto bg-white text-primary px-6 py-3 rounded-xl font-black text-[9px] uppercase whitespace-nowrap hover:bg-secondary transition-all">
                  Apply Strategy →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}