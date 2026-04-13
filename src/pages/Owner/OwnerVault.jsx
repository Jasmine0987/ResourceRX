import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, FileText, Download, AlertTriangle, History, Plus, Eye, CheckCircle, Clock, ChevronLeft, Upload, X, Loader } from 'lucide-react';

const INIT_VAULT = [
  { id:1, name:"ISO 13485:2016 Quality Mgmt",    type:"Quality Mgmt", expiry:"Dec 2026", status:"Active",        asset:"India Fleet"               },
  { id:2, name:"AERB Radiation Safety Cert",      type:"Compliance",   expiry:"Aug 2026", status:"Active",        asset:"Siemens MRI #04"           },
  { id:3, name:"Third-Party Liability Insurance", type:"Legal",        expiry:"Feb 2026", status:"Expiring Soon", asset:"All Mobile Units"          },
  { id:4, name:"CDSCO MD-15 Clearance",           type:"Regulatory",   expiry:"N/A",      status:"Permanent",     asset:"GE CT Scanner"             },
  { id:5, name:"BIS Certification IS 13450",      type:"Regulatory",   expiry:"Mar 2027", status:"Active",        asset:"Draeger Evita V500"        },
  { id:6, name:"NABH Equipment Accreditation",    type:"Quality Mgmt", expiry:"Jun 2027", status:"Active",        asset:"Philips IntelliVue MX800"  },
];

const STATUS_COLOR = { Active:'text-emerald-600', 'Expiring Soon':'text-amber-500', Permanent:'text-primary' };

export default function OwnerVault() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [vault, setVault] = useState(INIT_VAULT);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState([
    { action:"Doc Downloaded", user:"Admin (You)", time:"10m ago" },
    { action:"Vault Synced",   user:"System",      time:"2h ago" },
    { action:"New ISO Upload", user:"Admin (You)", time:"2d ago" },
  ]);

  const handleUpload = (files) => {
    setUploading(true);
    setTimeout(() => {
      const newDocs = Array.from(files).map((f, i) => ({
        id: Date.now() + i, name: f.name.replace(/\.[^.]+$/, ''), type: "Uploaded", expiry: "Dec 2027", status: "Active", asset: "Pending Assignment"
      }));
      setVault(prev => [...newDocs, ...prev]);
      setLogs(prev => [{ action: `Uploaded: ${files[0].name}`, user: "Admin (You)", time: "Just now" }, ...prev.slice(0, 4)]);
      setUploading(false);
    }, 1800);
  };

  const removeDoc = (id) => setVault(prev => prev.filter(v => v.id !== id));
  const [preview, setPreview] = useState(null);

  const downloadDoc = (doc) => {
    const txt = `ResourceRX Vault Document\n\nName: ${doc.name}\nType: ${doc.type}\nAsset: ${doc.asset}\nExpiry: ${doc.expiry}\nStatus: ${doc.status}\n\nSHA-256 Verified | ResourceRX Protocol`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'})); a.download=`${doc.name}.txt`; a.click();
    setLogs(prev => [{ action: `Downloaded: ${doc.name}`, user: "Admin (You)", time: "Just now" }, ...prev.slice(0,4)]);
  };

  const expiring = vault.filter(v => v.status === 'Expiring Soon').length;
  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  // Preview modal renderer
  const PreviewModal = () => {
    if (!preview) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={()=>setPreview(null)}>
        <div className="glass-panel p-10 rounded-[3rem] max-w-lg w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] font-black bg-secondary text-white px-3 py-1 rounded-full uppercase">{preview.type}</span>
              <h3 className="text-2xl font-black tracking-tighter mt-3 text-primary">{preview.name}</h3>
              <p className="text-xs font-bold opacity-40 uppercase mt-1 text-primary">{preview.asset}</p>
            </div>
            <button onClick={()=>setPreview(null)} className="p-2 rounded-xl hover:bg-primary/10 transition-all text-primary opacity-40 hover:opacity-100">✕</button>
          </div>
          <div className="space-y-3 bg-white/50 rounded-2xl p-6 mb-6">
            {[
              ['Document ID', preview.id],
              ['Status', preview.status],
              ['Expiry', preview.expiry],
              ['Asset', preview.asset],
              ['Verified By', 'ResourceRX Protocol SHA-256'],
            ].map(([k,v])=>(
              <div key={k} className="flex justify-between text-xs">
                <span className="font-black opacity-40 uppercase text-primary">{k}</span>
                <span className={`font-black uppercase ${v==='Active'?'text-emerald-600':v==='Expiring Soon'?'text-amber-600':'text-primary'}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{downloadDoc(preview);setPreview(null);}} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all">Download File</button>
            <button onClick={()=>setPreview(null)} className="px-8 glass-panel rounded-2xl font-black text-[10px] uppercase text-primary hover:bg-white/60 transition-all">Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity"><ChevronLeft size={14}/> Control Center</button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase mb-3 text-emerald-600 border border-emerald-500/20"><Lock size={12}/> End-to-End Encrypted Storage</div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Certification Vault</h2>
        </div>
        <label className="bg-primary text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-secondary hover:text-primary transition-all shadow-xl cursor-pointer">
          {uploading ? <><Loader size={18} className="animate-spin"/> Uploading…</> : <><Plus size={18}/> Upload Document</>}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={e=>handleUpload(e.target.files)} disabled={uploading}/>
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label:"Vault Integrity",  val:"100%",          sub:"All Nodes Synced",         icon:ShieldCheck,  color:"text-emerald-500" },
          { label:"Active Certs",     val:vault.length.toString(), sub:"Verified by ResourceRX",  icon:FileText,     color:"text-primary"     },
          { label:"Action Required",  val:expiring.toString().padStart(2,'0'), sub:`Expiring in 30 Days`, icon:AlertTriangle, color:"text-amber-500"   },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-8 rounded-[2.5rem] flex items-center gap-6">
            <div className={`p-5 rounded-2xl bg-white/50 ${stat.color} shadow-inner`}><stat.icon size={28}/></div>
            <div>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tighter text-primary">{stat.val}</h3>
              <p className="text-[9px] font-bold opacity-50 uppercase tracking-tighter text-primary">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={glass}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black tracking-tighter italic uppercase text-primary">Document Registry</h3>
          <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase text-primary"><History size={14}/> Last Audit: 2 Hours Ago</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] text-primary">
                <th className="px-8 pb-4">Classification</th><th className="px-8 pb-4">Document</th><th className="px-8 pb-4">Linked Asset</th><th className="px-8 pb-4">Expiration</th><th className="px-8 pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {vault.map((item, i) => (
                  <motion.tr key={item.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}} transition={{delay:i*0.04}}
                    className="bg-white/40 rounded-3xl group hover:bg-white/70 transition-all">
                    <td className="px-8 py-5 rounded-l-3xl">
                      <span className="text-[9px] font-black uppercase px-3 py-1 bg-primary/5 rounded-full border border-primary/10 text-primary">{item.type}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-primary">{item.name}</span>
                        <span className="text-[8px] font-bold opacity-30 uppercase text-primary">SHA-256 Verified</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-primary/60 uppercase">{item.asset}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className={item.status==='Expiring Soon'?'text-amber-500':'text-primary/20'}/>
                        <span className={`text-xs font-black ${STATUS_COLOR[item.status]||'text-primary'}`}>{item.expiry}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right rounded-r-3xl">
                      <div className="flex justify-end gap-2">
                        <button onClick={()=>setPreview(item)} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform text-primary/40 hover:text-primary"><Eye size={16}/></button>
                        <button onClick={()=>downloadDoc(item)} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform text-primary/40 hover:text-primary"><Download size={16}/></button>
                        <button onClick={()=>removeDoc(item.id)} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><X size={16}/></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className={`${glass} bg-primary text-white`}>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 italic uppercase"><CheckCircle className="text-secondary"/> Automated Compliance</h3>
          <p className="text-xs font-bold opacity-60 leading-relaxed uppercase mb-8">The ResourceRX protocol auto-syncs with state health departments to pre-verify equipment. No manual filing for 80% of regional deployments.</p>
          <div className="space-y-3">
            {["CDSCO Portal Sync","AERB Compliance API","IRDAI Insurance Oracle"].map((link,i)=>(
              <div key={i} className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest">{link}</span>
                <span className="text-[8px] font-black text-secondary uppercase px-2 py-0.5 bg-secondary/10 rounded-full">Connected</span>
              </div>
            ))}
          </div>
        </div>
        <div className={glass}>
          <h3 className="text-xl font-black mb-8 italic uppercase text-primary">Security Log</h3>
          <div className="space-y-5">
            {logs.map((log,i)=>(
              <div key={i} className="flex justify-between items-center pb-4 border-b border-primary/5 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-secondary"/>
                  <div><p className="text-xs font-black uppercase tracking-tighter text-primary">{log.action}</p><p className="text-[9px] font-bold opacity-30 uppercase text-primary">{log.user}</p></div>
                </div>
                <span className="text-[9px] font-black opacity-30 uppercase text-primary">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PreviewModal />
    </div>
  );
}