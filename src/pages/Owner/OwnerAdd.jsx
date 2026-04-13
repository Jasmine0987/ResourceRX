import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ShieldCheck, UploadCloud, Zap, Info, ChevronRight, Settings2, CheckCircle2, X, ChevronLeft, Loader } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

const CATEGORIES = ["Magnetic Resonance Imaging (MRI)","Computed Tomography (CT)","Dialysis Mobile Unit","Digital X-Ray System","Ventilator / Respiratory","Surgical Robot"];
const SPECS = {
  "Magnetic Resonance Imaging (MRI)": [{label:"Magnetic Strength",unit:"Tesla",ph:"1.5 or 3.0"},{label:"Bore Diameter",unit:"mm",ph:"70"},{label:"Software Version",unit:"OS",ph:"v4.2.1"}],
  "Computed Tomography (CT)": [{label:"Slice Count",unit:"slices",ph:"256"},{label:"Rotation Speed",unit:"sec",ph:"0.27"},{label:"Software Version",unit:"OS",ph:"v3.1"}],
  default: [{label:"Power Rating",unit:"kW",ph:"15"},{label:"Weight",unit:"kg",ph:"850"},{label:"Software Build",unit:"ver",ph:"v2.0"}],
};

const CATEGORY_TO_TYPE = {
  "Magnetic Resonance Imaging (MRI)": "MRI",
  "Computed Tomography (CT)": "CT Scanner",
  "Dialysis Mobile Unit": "Dialysis",
  "Digital X-Ray System": "X-Ray",
  "Ventilator / Respiratory": "Ventilator",
  "Surgical Robot": "Surgical",
};

export default function OwnerAdd() {
  const navigate = useNavigate();
  const { addOwnerAsset } = useClinic();
  const fileRef = useRef();
  const [step, setStep] = useState(1);
  const [submitting, setSubmit] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ category: CATEGORIES[0], model:'', serial:'', year:'', dailyRate:'', dynamicYield:true, minDuration:'7' });
  const [specVals, setSpecVals] = useState({});

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };

  const validate1 = () => {
    const e = {};
    if (!form.model.trim()) e.model = 'Required';
    if (!form.serial.trim()) e.serial = 'Required';
    if (!form.year || +form.year < 1990 || +form.year > 2025) e.year = 'Enter valid year';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validate3 = () => {
    const e = {};
    if (!form.dailyRate || +form.dailyRate < 5000) e.dailyRate = 'Min ₹5,000/day required';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate3()) return;
    setSubmit(true);
    setTimeout(() => {
      // Add to global context so dashboard + requests can see it
      addOwnerAsset({
        name: form.model,
        type: CATEGORY_TO_TYPE[form.category] || form.category,
        location: 'Your Location',
        price: parseInt(form.dailyRate) || 500,
        status: 'Available',
        serial: form.serial,
        year: form.year,
      });
      setSubmit(false);
      setDone(true);
    }, 2500);
  };

  const specs = SPECS[form.category] || SPECS.default;
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  if (done) return (
    <div className="max-w-xl mx-auto pt-20 text-center">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring'}}>
        <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-8"/>
      </motion.div>
      <h2 className="text-4xl font-black tracking-tighter text-primary mb-4">Asset Listed!</h2>
      <p className="text-sm font-bold opacity-50 uppercase text-primary mb-10">{form.model} submitted for verification. Appears in registry within 24 hours.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={() => navigate('/owner')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Dashboard</button>
        <button onClick={() => {setDone(false);setStep(1);setForm({category:CATEGORIES[0],model:'',serial:'',year:'',dailyRate:'',dynamicYield:true,minDuration:'7'});setFiles([]);}}
          className="glass-panel px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary">Add Another</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-6">
      <div className="mb-10">
        <button onClick={() => navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
          <ChevronLeft size={14}/> Control Center
        </button>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4 text-primary">
          <PlusCircle size={14} className="text-secondary"/> Asset Commissioning Protocol
        </div>
        <h2 className="text-5xl font-black tracking-tighter italic text-primary">Register Equipment</h2>
      </div>

      <div className="flex gap-4 mb-4">
        {[1,2,3].map(i => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-primary/5">
            <motion.div initial={{width:0}} animate={{width:step>=i?'100%':'0%'}} className="h-full bg-secondary"/>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-black uppercase mb-8 text-primary">
        <span className={step>=1?'opacity-100':'opacity-30'}>01. Identity</span>
        <span className={step>=2?'opacity-100':'opacity-30'}>02. Specs</span>
        <span className={step>=3?'opacity-100':'opacity-30'}>03. Pricing & Docs</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-8">
            <div className={glass}>
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3 italic uppercase text-primary"><Settings2 className="text-secondary"/> 01. Asset Identity</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-4 text-primary">Equipment Category</label>
                  <select value={form.category} onChange={e=>set('category',e.target.value)} className="w-full glass-panel px-8 py-5 rounded-3xl font-bold bg-white/50 outline-none text-primary focus:ring-2 ring-secondary">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                {[
                  {key:'model',label:'Manufacturer & Model *',ph:'e.g. Siemens Magnetom Sola'},
                  {key:'serial',label:'Serial Number (UID) *',ph:'SN-XXXX-XXXX-XXXX'},
                  {key:'year',label:'Year of Manufacture *',ph:'2024',type:'number'},
                  {key:'location',label:'Storage Location',ph:'City, State'},
                ].map(f => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-4 text-primary">{f.label}</label>
                    <input type={f.type||'text'} placeholder={f.ph} value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)}
                      className={`w-full glass-panel px-8 py-5 rounded-3xl font-bold bg-white/50 outline-none text-primary ${errors[f.key]?'ring-2 ring-red-400':'focus:ring-2 ring-secondary'}`}/>
                    {errors[f.key] && <p className="text-red-500 text-[10px] font-black ml-4">{errors[f.key]}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => {if(validate1())setStep(2);}} className="bg-primary text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-secondary hover:text-primary transition-all shadow-xl">
                Technical Specs <ChevronRight size={18}/>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-8">
            <div className={glass}>
              <h3 className="text-2xl font-black mb-2 flex items-center gap-3 italic uppercase text-primary"><Zap className="text-secondary"/> 02. Performance Metrics</h3>
              <p className="text-xs font-bold opacity-40 uppercase mb-8 text-primary">Specs for: {form.category}</p>
              <div className="grid md:grid-cols-3 gap-6">
                {specs.map((sp, i) => (
                  <div key={i} className="p-8 bg-white/30 rounded-[2.5rem] border border-white">
                    <p className="text-[10px] font-black uppercase opacity-40 mb-4 text-primary">{sp.label}</p>
                    <div className="flex items-center gap-3">
                      <input type="text" placeholder={sp.ph} value={specVals[i]||''} onChange={e=>setSpecVals(v=>({...v,[i]:e.target.value}))}
                        className="bg-transparent border-none font-black text-2xl w-full outline-none text-primary"/>
                      <span className="text-[10px] font-black opacity-20 text-primary">{sp.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-8 bg-secondary/5 rounded-[2.5rem] border border-secondary/10 flex items-start gap-4">
                <Info className="text-secondary shrink-0" size={20}/>
                <p className="text-[10px] font-bold uppercase leading-relaxed text-primary/60">Technical verification required: Asset will undergo remote diagnostic ping before listing is finalized.</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="font-black uppercase text-[10px] opacity-40 hover:opacity-100 transition-all text-primary flex items-center gap-2"><ChevronLeft size={14}/> Go Back</button>
              <button onClick={() => setStep(3)} className="bg-primary text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-secondary hover:text-primary transition-all shadow-xl">
                Compliance & Pricing <ChevronRight size={18}/>
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className={glass}>
                <h3 className="text-2xl font-black mb-8 italic uppercase text-primary">03. Documentation</h3>
                <label className="p-10 border-2 border-dashed border-primary/10 rounded-[3rem] flex flex-col items-center justify-center text-center gap-4 hover:bg-white/40 transition-all cursor-pointer group mb-4">
                  <UploadCloud size={36} className="text-secondary group-hover:scale-110 transition-transform"/>
                  <div>
                    <p className="font-black text-sm uppercase text-primary">Upload ISO Certifications</p>
                    <p className="text-[10px] font-bold opacity-30 mt-1 uppercase text-primary">PDF, JPEG — Max 10MB each</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden"
                    onChange={e=>setFiles(prev=>[...prev,...Array.from(e.target.files)])}/>
                </label>
                {files.map((f,i) => (
                  <div key={i} className="p-4 bg-white/60 rounded-2xl flex items-center justify-between border border-white mb-2">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-emerald-500" size={16}/>
                      <span className="text-[10px] font-bold uppercase text-primary truncate max-w-[180px]">{f.name}</span>
                    </div>
                    <button onClick={() => setFiles(prev=>prev.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                  </div>
                ))}
              </div>
              <div className={glass}>
                <h3 className="text-2xl font-black mb-8 italic uppercase text-primary">Pricing Strategy</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-4 text-primary">Daily Base Rate (INR) *</label>
                    <div className="relative">
                      <span className="absolute left-7 top-1/2 -translate-y-1/2 font-black text-2xl text-secondary">₹</span>
                      <input type="number" placeholder="35000" value={form.dailyRate} onChange={e=>set('dailyRate',e.target.value)}
                        className={`w-full glass-panel pl-14 pr-8 py-5 rounded-3xl font-black text-2xl bg-white/50 outline-none text-primary ${errors.dailyRate?'ring-2 ring-red-400':'focus:ring-2 ring-secondary'}`}/>
                    </div>
                    {errors.dailyRate && <p className="text-red-500 text-[10px] font-black ml-4">{errors.dailyRate}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-4 text-primary">Minimum Duration (Days)</label>
                    <input type="number" value={form.minDuration} onChange={e=>set('minDuration',e.target.value)} placeholder="7"
                      className="w-full glass-panel px-8 py-5 rounded-3xl font-bold bg-white/50 outline-none text-primary focus:ring-2 ring-secondary"/>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl cursor-pointer hover:bg-primary/10 transition-all"
                    onClick={() => set('dynamicYield',!form.dynamicYield)}>
                    <div className="flex items-center gap-3">
                      <Zap className="text-secondary" size={18}/>
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary">Enable Dynamic Yield</span>
                        <p className="text-[9px] opacity-40 text-primary uppercase">AI-driven surge pricing</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative shadow-inner transition-colors ${form.dynamicYield?'bg-secondary':'bg-primary/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.dynamicYield?'right-1':'left-1'}`}/>
                    </div>
                  </div>
                  {form.dailyRate && (
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Projected Monthly @ 80% Utilisation</p>
                      <p className="text-2xl font-black text-emerald-700">₹{(+form.dailyRate*30*0.8).toLocaleString('en-IN',{maximumFractionDigits:0})}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-4">
              {submitting ? <><Loader size={22} className="animate-spin"/> Registering…</> : <><CheckCircle2 size={22}/> Finalize Asset Listing</>}
            </button>
            <div className="text-center">
              <button onClick={() => setStep(2)} className="font-black uppercase text-[10px] opacity-20 hover:opacity-100 transition-all text-primary">← Review Configuration</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}