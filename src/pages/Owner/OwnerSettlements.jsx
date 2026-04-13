import React, { useState } from 'react';
import { useCurrency } from '../../hooks/useRealData';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowUpRight, Download, ShieldCheck, Clock, Banknote, History, Lock, ChevronRight, ChevronLeft, Loader, CheckCircle2 } from 'lucide-react';

const TXS = [
  { id:"SET-8821", facility:"Apollo Hospitals Hyderabad",  amount:2045750, status:"Available",  date:"Jan 12, 2026", type:"Rental Payout"      },
  { id:"SET-8819", facility:"Fortis Hospital Bengaluru",   amount:1519700, status:"In Escrow",  date:"Jan 14, 2026", type:"Security Deposit"   },
  { id:"SET-8790", facility:"AIIMS Delhi",                 amount:1035400, status:"Processing", date:"Jan 10, 2026", type:"Service Fee Refund" },
  { id:"SET-8765", facility:"Rainbow Children's Hospital", amount:818300,  status:"Available",  date:"Jan 08, 2026", type:"Rental Payout"      },
];

const STATUS_STYLE = {
  Available:  "border-emerald-500/20 text-emerald-600 bg-emerald-50",
  "In Escrow":"border-amber-500/20 text-amber-600 bg-amber-50",
  Processing: "border-blue-500/20 text-blue-600 bg-blue-50",
};

function downloadCSV() {
  const csv = ['ID,Facility,Amount,Status,Date,Type',...TXS.map(t=>`${t.id},${t.facility},$${t.amount},${t.status},${t.date},${t.type}`)].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='Settlements.csv'; a.click();
}

export default function OwnerSettlements() {
  const { rates, format, source: ratesSource } = useCurrency('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'CAD', 'AUD'];
  const navigate = useNavigate();
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [bankEdit, setBankEdit] = useState(false);
  const [bankAccount, setBankAccount] = useState('HDFC Bank — Current A/C');

  const available = TXS.filter(t=>t.status==='Available').reduce((s,t)=>s+t.amount,0);
  const escrow    = TXS.filter(t=>t.status==='In Escrow').reduce((s,t)=>s+t.amount,0);
  const fmtAvail  = format(available, displayCurrency);
  const fmtEscrow = format(escrow, displayCurrency);

  const doWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => { setWithdrawing(false); setWithdrawn(true); }, 2200);
  };

  const glass = "glass-panel p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/owner')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity"><ChevronLeft size={14}/> Control Center</button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-3 text-primary"><Lock size={12} className="text-secondary"/> Encrypted Ledger</div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Settlement Registry</h2>
        </div>
        <button onClick={doWithdraw} disabled={withdrawing||withdrawn}
          className="bg-primary text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-secondary hover:text-primary transition-all shadow-xl disabled:opacity-60">
          {withdrawing?<><Loader size={16} className="animate-spin"/> Processing…</>:withdrawn?<><CheckCircle2 size={16}/> Withdrawn!</>:<>Withdraw ₹{available.toLocaleString('en-IN')} <ArrowUpRight size={16}/></>}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className={`${glass} bg-primary text-white border-none`}>
          <div className="flex justify-between items-start mb-10">
            <Wallet className="text-secondary" size={32}/>
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Available Balance</p>
          </div>
          <h3 className="text-5xl font-black tracking-tighter mb-2">₹{available.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] font-bold opacity-40 uppercase">Ready for immediate liquidation</p>
        </motion.div>
        <div className={glass}>
          <div className="flex justify-between items-start mb-10"><Clock className="text-primary/20" size={32}/><p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">In Escrow</p></div>
          <h3 className="text-4xl font-black tracking-tighter mb-2 text-primary">₹{escrow.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] font-bold text-secondary uppercase">Awaiting equipment return scan</p>
        </div>
        <div className={glass}>
          <div className="flex justify-between items-start mb-10"><Banknote className="text-primary/20" size={32}/><p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-primary">YTD Earnings</p></div>
          <h3 className="text-4xl font-black tracking-tighter mb-2 text-primary">₹7.45Cr</h3>
          <p className="text-[10px] font-bold text-emerald-500 uppercase">+22% vs last fiscal year</p>
        </div>
      </div>

      <div className={glass}>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center"><History size={20} className="text-primary"/></div>
            <h3 className="text-2xl font-black tracking-tighter uppercase italic text-primary">Payment Ledger</h3>
          </div>
          <div className="flex items-center gap-2 mr-4">
              <span className="text-[9px] font-black uppercase opacity-40 text-primary">Currency</span>
              <select value={displayCurrency} onChange={e=>setDisplayCurrency(e.target.value)}
                className="glass-panel text-[10px] font-black uppercase px-3 py-2 rounded-xl outline-none text-primary cursor-pointer">
                {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              {ratesSource && <span className="text-[8px] font-bold opacity-30 uppercase text-primary">{ratesSource}</span>}
            </div>
            <button onClick={downloadCSV} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-30 hover:opacity-100 transition-opacity text-primary"><Download size={14}/> Download 1099-K</button>
        </div>
        <div className="space-y-4">
          {TXS.map((tx, i) => (
            <motion.div key={tx.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}}
              className="rounded-[2.5rem] overflow-hidden cursor-pointer" onClick={()=>setExpanded(expanded===tx.id?null:tx.id)}>
              <div className="group flex items-center justify-between p-8 bg-white/30 border border-white hover:bg-white/60 transition-all">
                <div className="flex items-center gap-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.status==='Available'?'bg-emerald-500/10 text-emerald-600':'bg-amber-500/10 text-amber-600'}`}><ShieldCheck size={24}/></div>
                  <div>
                    <p className="text-[9px] font-black opacity-30 uppercase mb-1 text-primary">{tx.id} · {tx.date}</p>
                    <h4 className="text-lg font-black tracking-tight text-primary uppercase">{tx.facility}</h4>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter text-primary">{tx.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-tighter text-primary">+{format(tx.amount, displayCurrency)}</p>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${STATUS_STYLE[tx.status]}`}>{tx.status}</span>
                  </div>
                  <ChevronRight className={`opacity-20 group-hover:opacity-100 transition-all text-primary ${expanded===tx.id?'rotate-90':''}`}/>
                </div>
              </div>
              <AnimatePresence>
                {expanded === tx.id && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                    className="overflow-hidden bg-white/20 border-t border-primary/5">
                    <div className="p-8 flex gap-8">
                      <div><p className="text-[9px] font-black uppercase opacity-30 text-primary mb-1">Transaction ID</p><p className="font-black text-primary">{tx.id}</p></div>
                      <div><p className="text-[9px] font-black uppercase opacity-30 text-primary mb-1">Settlement Date</p><p className="font-black text-primary">{tx.date}</p></div>
                      <div><p className="text-[9px] font-black uppercase opacity-30 text-primary mb-1">Category</p><p className="font-black text-primary">{tx.type}</p></div>
                      <button onClick={e=>{e.stopPropagation();downloadCSV();}} className="ml-auto glass-panel px-6 py-3 rounded-xl font-black text-[9px] uppercase text-primary flex items-center gap-2 hover:bg-white/60 transition-all"><Download size={12}/> Receipt</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className={`${glass}`}>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-40 text-primary">Settlement Velocity</h4>
          <p className="text-[9px] font-bold opacity-30 uppercase text-primary mb-6">7-day payout window — daily volumes ($k)</p>
          {/* Fixed-height chart with relative bars */}
          <div className="flex items-end gap-2 h-28 w-full">
            {[
              {h:40,d:'Mon',v:'₹3.3L'},
              {h:70,d:'Tue',v:'₹5.8L'},
              {h:45,d:'Wed',v:'₹3.8L'},
              {h:90,d:'Thu',v:'₹7.5L'},
              {h:65,d:'Fri',v:'₹5.4L'},
              {h:80,d:'Sat',v:'₹6.7L'},
              {h:100,d:'Sun',v:'₹8.4L'},
            ].map((bar,i)=>(
              <div key={i} className="flex-1 flex flex-col items-end justify-end gap-1" style={{height:'100%'}}>
                <p className="text-[7px] font-black text-secondary" style={{marginBottom:2}}>{bar.v}</p>
                <motion.div
                  initial={{height:0}}
                  animate={{height:`${bar.h}%`}}
                  transition={{duration:0.6,delay:i*0.08}}
                  className="w-full rounded-t-lg"
                  style={{minHeight:6, background:'linear-gradient(to top, #1d3557, #a8dadc)'}}
                />
                <p className="text-[7px] font-black opacity-40 text-primary" style={{marginTop:4}}>{bar.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"/>
            <p className="text-[10px] font-bold text-emerald-700">Avg payout velocity: <span className="font-black">2.4 days</span> — 1.2 days faster than last month</p>
          </div>
        </div>
        <div className={glass}>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 opacity-40 text-primary">Payout Destination</h4>
          <div className="flex items-center gap-6 p-6 bg-white/50 rounded-[2rem] border border-white mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white"><Banknote size={20}/></div>
            {bankEdit ? (
              <input value={bankAccount} onChange={e=>setBankAccount(e.target.value)} onBlur={()=>setBankEdit(false)} autoFocus
                className="flex-1 bg-transparent outline-none font-black text-primary border-b border-secondary text-xs uppercase"/>
            ) : (
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-primary">{bankAccount}</p>
                <p className="text-[10px] font-bold opacity-30 text-primary">XXXX XXXX 8821</p>
              </div>
            )}
            <button onClick={()=>setBankEdit(true)} className="ml-auto text-[9px] font-black text-secondary uppercase border-b border-secondary/20">Edit</button>
          </div>
          <button onClick={()=>navigate('/owner/analytics')} className="w-full py-4 glass-panel rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-white/60 transition-all flex items-center justify-center gap-2">
            View Full Analytics <ArrowUpRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}