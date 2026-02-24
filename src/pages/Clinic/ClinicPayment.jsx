import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, Lock, ChevronRight,
  Building2, CheckCircle2, Wallet, ArrowUpRight,
  Loader2, AlertCircle, Package
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import '../../App.css';

const PAYMENT_METHODS = [
  { id: 'credit',   name: "Institutional Credit Line", icon: Building2, desc: "Direct hospital billing · No upfront charge" },
  { id: 'wallet',   name: "Digital Wallet / Stripe",    icon: Wallet,    desc: "Instant authorization · Escrow-protected" },
  { id: 'wire',     name: "Direct Wire Transfer",       icon: ArrowUpRight, desc: "Standard 24h clearing · For large orders" },
];

export default function ClinicPayment() {
  const navigate = useNavigate();
  const { currentBooking, completePayment } = useClinic();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing]         = useState(false);
  const [processed, setProcessed]           = useState(false);
  const [cardNum, setCardNum]               = useState('');
  const [cardExp, setCardExp]               = useState('');
  const [cardCVV, setCardCVV]               = useState('');
  const [orgName, setOrgName]               = useState('');
  const [poNumber, setPoNumber]             = useState('');
  const [error, setError]                   = useState(null);

  if (!currentBooking) {
    return (
      <div className="pt-40 pb-20 px-6 max-w-4xl mx-auto text-center">
        <Package className="mx-auto opacity-20 mb-6" size={64} />
        <p className="font-black text-xl opacity-40">No active booking</p>
        <button onClick={() => navigate('/clinic/search')} className="mt-6 bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-secondary transition-all">
          Browse Equipment
        </button>
      </div>
    );
  }

  const durationHours = currentBooking.duration
    ? parseInt(currentBooking.duration)
    : 4;
  const subtotal      = currentBooking.price * durationHours;
  const dispatch      = 25;
  const platformFee   = Math.round(subtotal * 0.025);
  const total         = subtotal + dispatch + platformFee;

  const formatCard = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExp  = (v) => {
    const d = v.replace(/\D/g,'').slice(0,4);
    return d.length >= 2 ? d.slice(0,2) + '/' + d.slice(2) : d;
  };

  const validate = () => {
    if (!selectedMethod) { setError('Please select a payment method'); return false; }
    if (selectedMethod === 'wallet') {
      if (cardNum.replace(/\s/g,'').length < 16) { setError('Enter a valid 16-digit card number'); return false; }
      if (cardExp.length < 5) { setError('Enter a valid expiry date'); return false; }
      if (cardCVV.length < 3) { setError('Enter a valid CVV'); return false; }
    }
    if (selectedMethod === 'credit') {
      if (!orgName.trim()) { setError('Enter organization name'); return false; }
    }
    return true;
  };

  const handlePay = async () => {
    setError(null);
    if (!validate()) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2500)); // simulate payment
    completePayment();
    setProcessed(true);
    setProcessing(false);
    setTimeout(() => navigate('/clinic/tracking'), 1800);
  };

  if (processed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-40 pb-20 px-6 max-w-xl mx-auto text-center">
        <div className="glass-panel rounded-[3rem] p-16 space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-white" size={48} />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tighter">Payment Authorized</h2>
          <p className="text-gray-500 font-bold">Funds secured in escrow · Redirecting to tracking...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-40 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase mb-4 text-emerald-600">
          <Lock size={14} /> Encrypted Escrow Terminal
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Secure Payment</h2>
        <p className="text-gray-500 font-bold">Booking: {currentBooking.id} · {currentBooking.asset}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Payment methods */}
          <div className="glass-panel rounded-[3rem] p-10 space-y-5">
            <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Select Funding Method</h4>
            {PAYMENT_METHODS.map(m => (
              <div key={m.id} onClick={() => { setSelectedMethod(m.id); setError(null); }}
                className={`p-6 rounded-[2rem] flex items-center justify-between cursor-pointer transition-all border-2 ${selectedMethod === m.id ? 'border-emerald-500/50 bg-emerald-50/30' : 'glass-panel border-transparent hover:border-emerald-500/20'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${selectedMethod === m.id ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600'}`}>
                    <m.icon size={22} />
                  </div>
                  <div>
                    <p className="font-black text-lg tracking-tight">{m.name}</p>
                    <p className="text-xs font-bold text-gray-400">{m.desc}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all ${selectedMethod === m.id ? 'border-emerald-500 bg-emerald-500' : 'border-primary/20'}`}>
                  {selectedMethod === m.id && <CheckCircle2 className="text-white" size={20} />}
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic form based on method */}
          <AnimatePresence>
            {selectedMethod === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-panel rounded-[3rem] p-10 space-y-5">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Card Details</h4>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Card Number</label>
                  <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full glass-panel bg-white/40 py-4 px-6 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-400/30 tracking-widest" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-1">Expiry</label>
                    <input value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))}
                      placeholder="MM/YY" maxLength={5}
                      className="w-full glass-panel bg-white/40 py-4 px-6 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-400/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-1">CVV</label>
                    <input value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/,'').slice(0,4))}
                      placeholder="000" type="password"
                      className="w-full glass-panel bg-white/40 py-4 px-6 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-400/30" />
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'credit' && (
              <motion.div key="credit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-panel rounded-[3rem] p-10 space-y-5">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Institutional Details</h4>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Organization Name</label>
                  <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. St. Mary's Medical Center"
                    className="w-full glass-panel bg-white/40 py-4 px-6 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-400/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Purchase Order # (optional)</label>
                  <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="PO-2024-XXXX"
                    className="w-full glass-panel bg-white/40 py-4 px-6 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-400/30" />
                </div>
              </motion.div>
            )}

            {selectedMethod === 'wire' && (
              <motion.div key="wire" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-panel rounded-[3rem] p-10 space-y-4">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Wire Instructions</h4>
                {[
                  { label: "Bank", value: "First Medical Trust Bank" },
                  { label: "Account Name", value: "ResourceRX Escrow LLC" },
                  { label: "Account #", value: "••••••••4829" },
                  { label: "Routing #", value: "••••••0091" },
                  { label: "Reference", value: currentBooking.id },
                ].map(row => (
                  <div key={row.label} className="flex justify-between p-3 bg-white/40 rounded-xl">
                    <p className="text-[10px] font-black opacity-40 uppercase">{row.label}</p>
                    <p className="text-sm font-black">{row.value}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Escrow notice */}
          <div className="glass-panel rounded-2xl p-5 flex items-start gap-4">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-bold text-emerald-900/60 leading-tight">
              Funds are held in <strong>Secure Escrow</strong> and only released to the equipment owner upon successful operation completion and your confirmation.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="space-y-6">
          <div className="glass-panel bg-primary text-white p-10 rounded-[3rem] space-y-6 sticky top-32">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-widest">Billing Summary</h4>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[9px] font-black opacity-40 uppercase mb-1">Equipment</p>
                <p className="font-black text-sm leading-tight">{currentBooking.asset}</p>
                <p className="text-[10px] opacity-50">{currentBooking.selectedDate} · {currentBooking.duration}</p>
              </div>
              {[
                { label: "Equipment Access", val: `$${subtotal.toFixed(2)}` },
                { label: "Dispatch & Logistics", val: `$${dispatch.toFixed(2)}` },
                { label: "Platform Fee (2.5%)", val: `$${platformFee.toFixed(2)}` },
              ].map(r => (
                <div key={r.label} className="flex justify-between font-bold opacity-60 text-sm">
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-2xl font-black">
                <span>Total</span>
                <span className="text-emerald-400">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl flex items-start gap-2">
              <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[9px] font-bold opacity-50 uppercase">SSL · PCI DSS · HIPAA Protected</p>
            </div>
          </div>

          <button onClick={handlePay} disabled={processing || !selectedMethod}
            className="w-full bg-emerald-600 text-white p-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-40">
            {processing ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <>Authorize Payment · ${total.toFixed(2)} <ChevronRight size={20} /></>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}