import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Navigation, Clock, Activity, Truck, Zap,
  PackageCheck, ChevronRight, MapPin, Phone,
  CheckCircle, Package, AlertCircle
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import '../../App.css';

const MILESTONES = [
  { id: 0, status: "Order Confirmed",   icon: CheckCircle },
  { id: 1, status: "Asset Dispatched",  icon: Package },
  { id: 2, status: "In Transit",        icon: Truck },
  { id: 3, status: "Site Calibration",  icon: Zap },
  { id: 4, status: "Operation Ready",   icon: PackageCheck },
];

export default function ClinicTracking() {
  const navigate = useNavigate();
  const { currentBooking, bookingHistory } = useClinic();

  // ── FIXED: Fall back to the most recent IN TRANSIT booking from history
  //    if currentBooking is null (e.g. user navigated here from dashboard)
  const activeBooking = currentBooking && currentBooking.status !== "COMPLETED"
    ? currentBooking
    : bookingHistory.find(b => b.status === "IN TRANSIT" || b.status === "ACTIVE SESSION") || null;

  const [milestoneIdx, setMilestoneIdx] = useState(() => {
    if (activeBooking?.status === "ACTIVE SESSION") return 4;
    if (activeBooking?.status === "IN TRANSIT")     return 2;
    return 2;
  });
  const [eta, setEta]           = useState(14);
  const [velocity, setVelocity] = useState(42);

  // Reset milestone when booking changes
  useEffect(() => {
    if (activeBooking?.status === "ACTIVE SESSION") setMilestoneIdx(4);
    else if (activeBooking?.status === "IN TRANSIT") setMilestoneIdx(2);
  }, [activeBooking?.id]);

  // Animate ETA countdown
  useEffect(() => {
    if (eta <= 0) return;
    const t = setInterval(() => {
      setEta(e => Math.max(0, e - 1));
      setVelocity(v => Math.max(25, Math.min(90, v + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4))));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Advance milestones as ETA decreases
  useEffect(() => {
    if (eta <= 0 && milestoneIdx < 3) setMilestoneIdx(3);
  }, [eta]);

  useEffect(() => {
    if (eta <= 0 && milestoneIdx === 3) {
      const t = setTimeout(() => setMilestoneIdx(4), 3000);
      return () => clearTimeout(t);
    }
  }, [eta, milestoneIdx]);

  if (!activeBooking) {
    return (
      <div className="pt-40 px-6 max-w-4xl mx-auto text-center">
        <Package className="mx-auto opacity-20 mb-6" size={64} />
        <p className="font-black text-xl opacity-40">No active delivery to track</p>
        <p className="text-sm opacity-30 font-bold mt-2">Book equipment first, then track it here</p>
        <div className="flex gap-4 justify-center mt-6">
          <button onClick={() => navigate('/clinic/search')} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-secondary transition-all">
            Browse Equipment
          </button>
          <button onClick={() => navigate('/clinic/booking')} className="glass-panel px-8 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all">
            My Bookings
          </button>
        </div>
      </div>
    );
  }

  // ── FIXED: Always use activeBooking data, never fallbacks that show wrong machine ──
  const asset     = activeBooking.asset;
  const bookingId = activeBooking.id;
  const operator  = activeBooking.operator || "Assigned Operator";
  const from      = activeBooking.from || activeBooking.location || "Source Hospital";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-40 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/10 text-[10px] font-black uppercase mb-4 text-indigo-600">
          <Activity size={14} className="animate-pulse" /> Live Infrastructure Feed
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Live Tracking</h2>
        {/* ── FIXED: Shows the correct booking's info ── */}
        <p className="text-gray-500 font-bold">{asset} · REF: {bookingId}</p>
        <p className="text-xs opacity-40 font-bold mt-1">From: {from}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Animated map */}
          <div className="glass-panel rounded-[3.5rem] p-4 h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
              <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,#1d3557_1px,transparent_1px),linear-gradient(#1d3557_1px,transparent_1px)] [background-size:30px_30px]" />

              {/* Route SVG — FIXED: no undefined r values */}
              <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                <line x1="20%" y1="75%" x2="80%" y2="25%"
                  stroke="#457b9d" strokeWidth="3" strokeDasharray="8 4" opacity="0.6" />
                {/* Origin dot */}
                <circle cx="20%" cy="75%" r="7" fill="#1d3557" />
                <circle cx="20%" cy="75%" r="13" fill="none" stroke="#1d3557" strokeWidth="1" strokeOpacity="0.25" />
                {/* Destination dot (pulse) */}
                <circle cx="80%" cy="25%" r="8" fill="#10b981" stroke="white" strokeWidth="2" />

                {/* Moving vehicle dot — position calculated purely from eta, no undefined */}
                <motion.circle
                  r="9"
                  fill="#457b9d"
                  stroke="white"
                  strokeWidth="2.5"
                  initial={{ cx: "20%", cy: "75%" }}
                  animate={{
                    cx: eta <= 0 ? "80%" : `${20 + 60 * Math.max(0, (14 - eta)) / 14}%`,
                    cy: eta <= 0 ? "25%" : `${75 - 50 * Math.max(0, (14 - eta)) / 14}%`,
                  }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </svg>

              {/* Labels */}
              <div className="absolute bottom-[22%] left-[12%] bg-white/90 px-3 py-2 rounded-xl shadow-sm">
                <p className="text-[9px] font-black opacity-50 uppercase">Origin</p>
                <p className="text-xs font-black">{from}</p>
              </div>
              <div className="absolute top-[18%] right-[10%] bg-emerald-500 text-white px-3 py-2 rounded-xl shadow-sm">
                <p className="text-[9px] font-black opacity-70 uppercase">Destination</p>
                <p className="text-xs font-black">Your Clinic</p>
              </div>
            </div>

            {/* Bottom overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-10">
              <div className="glass-panel bg-white/90 p-5 rounded-3xl shadow-xl">
                <p className="text-[9px] font-black uppercase opacity-40">Velocity</p>
                <p className="text-2xl font-black">{velocity} <span className="text-sm font-bold opacity-50">km/h</span></p>
              </div>
              <div className={`p-5 rounded-3xl shadow-xl ${eta <= 0 ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
                <p className="text-[9px] font-black uppercase opacity-50">{eta <= 0 ? 'Arrived!' : 'ETA'}</p>
                <p className="text-2xl font-black">{eta <= 0 ? '✓' : `${eta} min`}</p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="glass-panel rounded-[3rem] p-10">
            <h4 className="text-[10px] font-black uppercase opacity-40 mb-8 tracking-widest">Protocol Milestones</h4>
            <div className="space-y-5">
              {MILESTONES.map((m, i) => {
                const isComplete = i < milestoneIdx;
                const isActive   = i === milestoneIdx;
                const isPending  = i > milestoneIdx;
                return (
                  <div key={m.id} className={`flex items-center gap-6 transition-all ${isPending ? 'opacity-25' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary/30'}`}>
                      {isComplete ? <CheckCircle size={18} /> : <m.icon size={18} />}
                    </div>
                    <div className="flex-1 border-b border-primary/5 pb-4 flex justify-between items-center">
                      <div>
                        <p className={`font-black tracking-tight text-base ${isActive ? 'text-primary' : ''}`}>{m.status}</p>
                        {isActive && <p className="text-[10px] font-bold text-secondary uppercase animate-pulse">In Progress</p>}
                        {isComplete && <p className="text-[10px] font-bold text-emerald-500 uppercase">Completed</p>}
                      </div>
                      {isActive && eta > 0 && (
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{eta} min ETA</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel bg-primary text-white p-10 rounded-[3rem] space-y-6">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
              <Truck size={28} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-indigo-300 tracking-widest mb-5">Delivery Details</h4>
              <div className="space-y-4">
                {[
                  { label: "Operator", val: operator },
                  { label: "Unit ID",  val: bookingId },
                  { label: "Payload",  val: asset.split(' ').slice(0, 3).join(' ') },
                  { label: "From",     val: from },
                  { label: "Time Slot", val: activeBooking.timeSlot || "—" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-start gap-4 font-bold text-sm">
                    <span className="opacity-40 shrink-0">{r.label}</span>
                    <span className="text-right text-sm">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase">
                <PackageCheck size={16} /> Asset Fully Insured
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="glass-panel rounded-[2.5rem] p-7 space-y-4">
            <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Emergency Contact</h4>
            <div className="flex items-center gap-3 p-4 bg-primary rounded-2xl text-white">
              <Phone size={18} className="text-secondary shrink-0" />
              <div>
                <p className="text-[9px] font-black opacity-40 uppercase">Dispatch Hotline</p>
                <p className="font-black text-sm">+1 (800) RX-EMERG</p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {milestoneIdx >= 4 ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/clinic/completion')}
                className="w-full bg-emerald-600 text-white p-6 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
              >
                Acknowledge Arrival <ChevronRight size={20} />
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate('/clinic/completion')}
                className="w-full glass-panel border-indigo-500/20 p-6 rounded-[2rem] font-black text-base hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3 border-2"
              >
                Mark as Arrived Early <ChevronRight size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}