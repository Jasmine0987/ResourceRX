import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star, MessageSquare, ThumbsUp, ChevronRight,
  Award, Heart, Zap, CheckCircle, Loader2, Package
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import '../../App.css';

const QUICK_TAGS = [
  { label: "On Time",            icon: "⏱" },
  { label: "Excellent Condition",icon: "✅" },
  { label: "Easy Setup",         icon: "🔧" },
  { label: "Recommend Provider", icon: "👍" },
  { label: "Flawless Operation", icon: "⭐" },
  { label: "Great Communication",icon: "💬" },
];

export default function ClinicFeedback() {
  const navigate  = useNavigate();
  const { currentBooking, completeBooking } = useClinic();

  const [rating, setRating]       = useState(0);
  const [hover, setHover]         = useState(0);
  const [comment, setComment]     = useState('');
  const [tags, setTags]           = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const xpEarned = () => {
    let xp = 0;
    if (rating > 0) xp += 10;
    if (comment.length > 50) xp += 15;
    if (tags.length > 0) xp += tags.length * 5;
    return xp;
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    completeBooking({ rating, comment, tags, xp: xpEarned() });
    setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-40 pb-20 px-6 max-w-xl mx-auto text-center">
        <div className="glass-panel rounded-[3rem] p-16 space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-violet-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="text-white" size={48} />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tighter">Thank You!</h2>
          <p className="text-gray-500 font-bold">+{xpEarned()} XP earned · Your feedback improves the network</p>
          <button onClick={() => navigate('/clinic')} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-secondary transition-all">
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-40 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-12 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-violet-500/10 text-[10px] font-black uppercase mb-4 text-violet-600">
          <MessageSquare size={14} /> Quality Assurance Loop
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Service Review</h2>
        <p className="text-gray-500 font-bold">
          {currentBooking?.asset || "Your Recent Equipment"} ·{' '}
          {currentBooking?.from || "Provider"}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Star rating */}
          <div className="glass-panel rounded-[3.5rem] p-12 text-center space-y-8">
            <h4 className="text-xs font-black uppercase opacity-40 tracking-widest">Rate Asset Performance</h4>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="transition-all duration-200 transform hover:scale-125 active:scale-110"
                >
                  <Star size={48}
                    className={`${(hover || rating) >= star ? 'text-violet-500 fill-violet-500' : 'text-gray-200'} transition-colors`} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm font-black text-violet-600">
                {['', 'Poor — We\'ll follow up', 'Below average', 'Good service', 'Great experience', 'Outstanding! 🌟'][rating]}
              </motion.p>
            )}
          </div>

          {/* Quick tags */}
          <div className="glass-panel rounded-[3rem] p-10 space-y-5">
            <h4 className="text-xs font-black uppercase opacity-40 tracking-widest">Quick Tags</h4>
            <div className="flex flex-wrap gap-3">
              {QUICK_TAGS.map(({ label, icon }) => (
                <button key={label} onClick={() => toggleTag(label)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase transition-all border-2 ${tags.includes(label) ? 'bg-violet-500 text-white border-violet-500' : 'glass-panel border-transparent hover:border-violet-300'}`}>
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Written comment */}
          <div className="glass-panel rounded-[3rem] p-10 space-y-4">
            <h4 className="text-xs font-black uppercase opacity-40 tracking-widest">Written Review</h4>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe the equipment condition, technician professionalism, and anything that could be improved..."
              className="w-full glass-panel bg-white/40 p-6 rounded-[2rem] outline-none font-medium text-sm min-h-[160px] border-2 border-transparent focus:border-violet-500/30 transition-all resize-none"
            />
            <div className="flex justify-between items-center text-[10px] font-black opacity-30 uppercase">
              <span>{comment.length} characters</span>
              {comment.length > 50 && <span className="text-violet-500">+15 XP bonus!</span>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel bg-primary text-white p-10 rounded-[3rem] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Heart size={160} className="text-violet-500" /></div>
            <h4 className="text-xs font-black uppercase text-violet-400 tracking-widest mb-6">Your Reputation</h4>
            <div className="space-y-5 relative z-10">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">XP This Review</p>
                <p className="text-3xl font-black">+{xpEarned()}<span className="text-sm text-violet-400 ml-1">XP</span></p>
              </div>
              <p className="text-xs font-bold opacity-50 leading-relaxed">
                High-quality feedback increases your clinic's priority for future emergency asset overrides.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Star Rating",   xp: 10,  done: rating > 0 },
                  { label: "Written Review",xp: 15,  done: comment.length > 50 },
                  { label: "Quick Tags",    xp: "5×", done: tags.length > 0 },
                ].map(r => (
                  <div key={r.label} className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all ${r.done ? 'text-emerald-400' : 'opacity-40'}`}>
                    {r.done ? <CheckCircle size={12} /> : <Zap size={12} />}
                    {r.label} +{r.xp}XP
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full bg-violet-600 text-white p-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <>Submit Feedback <ChevronRight size={20} /></>}
          </button>
          {!rating && <p className="text-center text-[10px] font-bold opacity-30 uppercase">Please give a star rating first</p>}
        </div>
      </div>
    </motion.div>
  );
}