import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, User, ChevronRight,
  ChevronLeft, Package, AlertCircle, CheckCircle
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import '../../App.css';

const HOURS = [
  "06:00 AM","07:00 AM","08:00 AM","09:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM"
];
const DURATIONS = ["2 Hours","4 Hours","6 Hours","8 Hours","12 Hours","24 Hours","48 Hours"];
const OPERATORS = [
  { name: "Dr. Aris Thorne",  role: "Senior Radiologist",   rating: 4.9 },
  { name: "Dr. Sara Chen",    role: "ICU Specialist",        rating: 4.8 },
  { name: "Tech. James Park", role: "Equipment Technician",  rating: 4.7 },
  { name: "Self-Operated",    role: "Your certified staff",  rating: null },
];

function getMiniCal(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ClinicBooking() {
  const navigate = useNavigate();
  const { currentBooking, confirmBookingDetails, bookingHistory, cancelBooking } = useClinic();

  const today = new Date();
  const [calYear, setCalYear]         = useState(today.getFullYear());
  const [calMonth, setCalMonth]       = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime]         = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [notes, setNotes]             = useState('');
  const [view, setView]               = useState('schedule');

  const days = getMiniCal(calYear, calMonth);
  const todayNum = today.getDate();
  const isToday = (d) => d === todayNum && calMonth === today.getMonth() && calYear === today.getFullYear();
  const isPast  = (d) => {
    if (!d) return true;
    const date = new Date(calYear, calMonth, d);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  };

  const canProceed = selectedDay && selectedTime && selectedDuration && selectedOperator;

  const handleConfirm = () => {
    const dateStr   = `${MONTH_NAMES[calMonth]} ${selectedDay}, ${calYear}`;
    const timeSlot  = `${MONTH_NAMES[calMonth]} ${selectedDay} · ${selectedTime} (${selectedDuration})`;

    // ── FIXED: confirmBookingDetails now adds to bookingHistory inside context
    //    so the new booking immediately shows on dashboard + active tab ──────
    confirmBookingDetails({
      selectedDate: dateStr,
      selectedTime,
      timeSlot,
      operator: selectedOperator.name,
      duration: selectedDuration,
      notes,
      status: "PENDING PAYMENT",
    });
    navigate('/clinic/payment');
  };

  const STATUS_STYLE = {
    "ACTIVE SESSION": "bg-emerald-500/10 text-emerald-600",
    "IN TRANSIT":     "bg-blue-500/10 text-blue-600",
    "PENDING SETUP":  "bg-amber-500/10 text-amber-600",
    "COMPLETED":      "bg-gray-500/10 text-gray-500",
    "PENDING PAYMENT":"bg-orange-500/10 text-orange-600",
    "PENDING BOOKING":"bg-purple-500/10 text-purple-600",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-40 pb-20 px-6 max-w-7xl mx-auto">

      <div className="mb-10 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4">
          <Calendar size={14} className="text-secondary" /> Schedule Management
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">My Bookings</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3 mb-8 ml-4">
        {[
          { id: 'schedule', label: currentBooking ? `New: ${currentBooking.asset?.split(' ').slice(0,2).join(' ')}` : 'Schedule New' },
          { id: 'active',   label: `Active (${bookingHistory.length})` }
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${view === tab.id ? 'bg-primary text-white' : 'glass-panel hover:bg-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── NEW BOOKING / SCHEDULE VIEW ── */}
        {view === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!currentBooking ? (
              <div className="glass-panel rounded-[3rem] p-16 text-center space-y-6">
                <Package className="mx-auto opacity-20" size={64} />
                <p className="font-black text-xl opacity-40">No equipment selected</p>
                <p className="text-sm opacity-30 font-bold">Find equipment in the catalog, then come back here to schedule</p>
                <button onClick={() => navigate('/clinic/search')} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-secondary transition-all flex items-center gap-2 mx-auto">
                  Browse Equipment <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                  {/* Selected equipment banner */}
                  <div className="glass-panel rounded-[2.5rem] p-8 flex items-center gap-6 border border-secondary/20">
                    <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                      <Package size={28} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase opacity-40 mb-1">Booking</p>
                      <p className="font-black text-lg tracking-tight">{currentBooking.asset}</p>
                      <p className="text-xs font-bold opacity-50">{currentBooking.from} · ${currentBooking.price}/hr</p>
                    </div>
                    <span className="text-[10px] font-black bg-secondary/10 text-secondary px-3 py-1 rounded-full uppercase">REF: {currentBooking.id}</span>
                  </div>

                  {/* Calendar */}
                  <div className="glass-panel rounded-[3rem] p-10 space-y-6">
                    <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Select Date</h4>
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={prevMonth} className="p-2 glass-panel rounded-xl hover:bg-white transition-all"><ChevronLeft size={16} /></button>
                      <p className="font-black text-lg">{MONTH_NAMES[calMonth]} {calYear}</p>
                      <button onClick={nextMonth} className="p-2 glass-panel rounded-xl hover:bg-white transition-all"><ChevronRight size={16} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="text-[9px] font-black opacity-30 uppercase pb-2">{d}</div>
                      ))}
                      {days.map((d, i) => (
                        <button key={i} disabled={!d || isPast(d)}
                          onClick={() => d && !isPast(d) && setSelectedDay(d)}
                          className={`aspect-square rounded-xl text-sm font-black transition-all
                            ${!d ? 'invisible' : ''}
                            ${isPast(d) ? 'opacity-20 cursor-not-allowed' : ''}
                            ${isToday(d) && selectedDay !== d ? 'ring-2 ring-secondary' : ''}
                            ${selectedDay === d ? 'bg-primary text-white shadow-lg scale-110' : d && !isPast(d) ? 'hover:bg-white hover:scale-105' : ''}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time + Duration */}
                  <div className="glass-panel rounded-[3rem] p-10 space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Start Time</h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {HOURS.map(h => (
                          <button key={h} onClick={() => setSelectedTime(h)}
                            className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedTime === h ? 'bg-secondary text-white' : 'glass-panel hover:bg-white'}`}>
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Duration</h4>
                      <div className="flex flex-wrap gap-2">
                        {DURATIONS.map(d => (
                          <button key={d} onClick={() => setSelectedDuration(d)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${selectedDuration === d ? 'bg-primary text-white border-primary' : 'glass-panel border-transparent'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operator selection */}
                  <div className="glass-panel rounded-[3rem] p-10 space-y-4">
                    <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2">Assign Operator</h4>
                    {OPERATORS.map(op => (
                      <div key={op.name} onClick={() => setSelectedOperator(op)}
                        className={`p-5 rounded-2xl flex items-center gap-5 cursor-pointer transition-all border-2 ${selectedOperator?.name === op.name ? 'border-secondary bg-secondary/5' : 'glass-panel border-transparent hover:border-secondary/20'}`}>
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                          {op.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-sm">{op.name}</p>
                          <p className="text-[10px] opacity-50 uppercase font-bold">{op.role}</p>
                        </div>
                        {op.rating && <span className="text-[10px] font-black text-yellow-500">★ {op.rating}</span>}
                        {selectedOperator?.name === op.name && <CheckCircle size={16} className="text-secondary shrink-0" />}
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="glass-panel rounded-[2.5rem] p-8 space-y-3">
                    <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Special Instructions</h4>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. patient is claustrophobic, needs extra prep time..."
                      className="w-full bg-white/40 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-secondary/20 resize-none h-24 glass-panel"
                    />
                  </div>
                </div>

                {/* Summary sidebar */}
                <div className="space-y-6">
                  <div className="glass-panel bg-primary text-white p-10 rounded-[3rem] space-y-6 sticky top-32">
                    <h4 className="text-xs font-black uppercase text-secondary tracking-widest">Booking Summary</h4>
                    <div className="space-y-4">
                      {[
                        { label: "Equipment", val: currentBooking.asset?.split(' ').slice(0,3).join(' ') },
                        { label: "Date",     val: selectedDay ? `${MONTH_NAMES[calMonth]} ${selectedDay}` : "Not selected" },
                        { label: "Time",     val: selectedTime || "Not selected" },
                        { label: "Duration", val: selectedDuration || "Not selected" },
                        { label: "Operator", val: selectedOperator?.name || "Not selected" },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between gap-4">
                          <p className="text-[10px] font-black opacity-40 uppercase">{r.label}</p>
                          <p className="text-[11px] font-black text-right">{r.val}</p>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between">
                          <p className="text-[10px] font-black opacity-40 uppercase">Est. Total</p>
                          <p className="font-black text-secondary">
                            {selectedDuration
                              ? `$${currentBooking.price * parseInt(selectedDuration)}`
                              : `$${currentBooking.price}/hr`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button onClick={handleConfirm} disabled={!canProceed}
                      className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                      Confirm & Pay <ChevronRight size={16} />
                    </button>
                    {!canProceed && (
                      <p className="text-[9px] text-center opacity-40 uppercase">Select date, time, duration & operator</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ACTIVE BOOKINGS VIEW ── */}
        {view === 'active' && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {bookingHistory.length === 0 && (
              <div className="glass-panel rounded-[3rem] p-16 text-center opacity-30">
                <Package className="mx-auto mb-4" size={48} />
                <p className="font-black text-xl">No bookings yet</p>
                <p className="text-sm mt-1">Complete a booking to see it here</p>
              </div>
            )}
            {bookingHistory.map((booking) => {
              const s = STATUS_STYLE[booking.status] || "bg-gray-500/10 text-gray-500";
              return (
                <div key={booking.id} className="glass-panel p-8 rounded-[3rem] flex flex-col xl:flex-row gap-8 items-center">
                  <div className="w-full xl:w-56 space-y-3">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${s}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {booking.status}
                    </div>
                    <h3 className="text-xl font-black tracking-tighter">{booking.asset}</h3>
                    <p className="text-xs font-bold opacity-40">REF: {booking.id}</p>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase flex items-center gap-1 mb-1"><Clock size={10}/> Time</p>
                      <p className="font-bold text-sm">{booking.timeSlot || "TBD"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase flex items-center gap-1 mb-1"><User size={10}/> Operator</p>
                      <p className="font-bold text-sm">{booking.operator || "TBD"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase flex items-center gap-1 mb-1"><MapPin size={10}/> Source</p>
                      <p className="font-bold text-sm">{booking.from || booking.location || "—"}</p>
                    </div>
                  </div>

                  <div className="w-full xl:w-40 flex flex-col gap-3">
                    {booking.status === "ACTIVE SESSION" && (
                      <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${booking.progress || 0}%` }}
                          className="h-full bg-emerald-400"
                        />
                      </div>
                    )}
                    {(booking.status === "IN TRANSIT" || booking.status === "ACTIVE SESSION") && (
                      <button onClick={() => navigate('/clinic/tracking')}
                        className="w-full py-3 glass-panel rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                        Track
                      </button>
                    )}
                    {booking.status === "PENDING PAYMENT" && (
                      <button onClick={() => navigate('/clinic/payment')}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">
                        Pay Now
                      </button>
                    )}
                    <button onClick={() => cancelBooking(booking.id)}
                      className="w-full py-3 bg-white/50 rounded-xl font-black text-[10px] uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}