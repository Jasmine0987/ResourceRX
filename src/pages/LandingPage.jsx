import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  Stethoscope,
  Building2,
  ArrowUpRight,
  Database,
  Zap,
  Truck,
  Search,
  PlusCircle,
  LogIn,
  ShieldAlert,
  BadgeCheck,
  LayoutDashboard,
  Clock,
  CircleDollarSign,
  Globe,
  Lock
} from 'lucide-react';
import '../App.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isEntryDone, setIsEntryDone] = useState(false);

  useEffect(() => {
    // Cinematic entry timer
    const timer = setTimeout(() => setIsEntryDone(true), 2400);
    return () => clearTimeout(timer);
  }, []);

  // CENTRALIZED AUTH CHECK
  // In the future, 'isLoggedIn' will come from your Context/Redux state
  const isLoggedIn = false; 

  const handleProtectedAction = (targetPath) => {
    if (!isLoggedIn) {
      // If not logged in, always force them to the login gate first
      navigate('/login');
    } else {
      navigate(targetPath);
    }
  };

  const logoText = "ResourceRX";

  return (
    <div className="min-h-screen text-primary font-sans selection:bg-accent overflow-x-hidden">

      {/* CINEMATIC INTRO */}
      <motion.div
        initial={{ x: "-50%", y: "-50%", left: "50%", top: "50%", scale: 1, position: 'fixed' }}
        animate={isEntryDone ? { 
          scale: 0.4, 
          left: "2.2rem", 
          top: "1.3rem", 
          x: "0%", 
          y: "0%" 
        } : {}}
        transition={{ duration: 1.4, ease: [0.8, 0, 0.2, 1] }}
        className="z-[100] pointer-events-none origin-left"
      >
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter flex">
          {logoText.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: "blur(15px)", x: 15 }}
              animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            >
              {i >= 8 ? <span className="text-secondary">{char}</span> : char}
            </motion.span>
          ))}
        </h1>
      </motion.div>

      {/* MAIN CONTENT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isEntryDone ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >

        {/* NAVBAR */}
        <nav className="fixed top-0 w-full h-20 flex items-center justify-between px-10 z-50">
          <div className="flex-1" /> 
          <div className="flex items-center gap-10">
            <div className="hidden md:flex gap-8 text-sm font-bold text-primary/60">
              <a href="#problem" className="hover:text-secondary transition-colors">The Gap</a>
              <a href="#how" className="hover:text-secondary transition-colors">Solution</a>
              <a href="#features" className="hover:text-secondary transition-colors">Features</a>
            </div>

            <div className="glass-panel px-6 py-2 flex gap-6 rounded-full text-sm font-bold shadow-sm">
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 hover:text-secondary transition-colors"
              >
                <LogIn size={16} /> Login
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary text-white px-5 py-2 rounded-full hover:scale-105 transition-transform shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <header className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass-panel rounded-[3rem] p-16 text-center md:text-left border border-white/40 shadow-sm"
          >
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase text-primary/70">
                <Zap size={14} className="text-secondary" />
                Infrastructure Elite
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-primary leading-tight">
                On-Demand Access to <br />
                <span className="text-secondary">Advanced Medical Equipment</span>
              </h2>

              <p className="text-lg text-gray-500 max-w-xl font-medium">
                Secure, pay-per-use access to MRI, CT scanners, and dialysis units for clinics and hospitals.
              </p>

              <div className="flex gap-4 pt-4 justify-center md:justify-start">
                <button 
                  onClick={() => handleProtectedAction('/search')}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
                >
                  <Search /> Book Equipment
                </button>
                <button 
                  onClick={() => handleProtectedAction('/owner/add')}
                  className="glass-panel px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-white/60 transition-all shadow-md text-primary border-white/60"
                >
                  <PlusCircle /> List Equipment
                </button>
              </div>
            </div>
          </motion.div>
        </header>

        {/* PROBLEM SECTION */}
        <section id="problem" className="py-24 px-6 max-w-7xl mx-auto">
          <h3 className="text-secondary uppercase tracking-[0.3em] font-black mb-4">The Gap</h3>
          <h2 className="text-4xl font-extrabold mb-12 text-primary">Why ResourceRX Exists</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { t: "High Capital Cost", i: CircleDollarSign },
              { t: "Idle Infrastructure", i: Clock },
              { t: "Limited Access", i: Globe },
              { t: "System Inefficiency", i: ShieldAlert }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="glass-panel p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-secondary/20 group"
              >
                <item.i className="text-secondary mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h4 className="font-bold text-primary">{item.t}</h4>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section id="how" className="py-24 px-6 bg-primary text-white rounded-[4rem] mx-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
            <h2 className="text-5xl font-black">A Shared Healthcare Infrastructure Platform</h2>
            <div className="space-y-4">
              {[
                { s: "List Equipment", i: PlusCircle, p: '/owner/add' },
                { s: "Book On-Demand", i: Search, p: '/search' },
                { s: "Operate Safely", i: ShieldCheck, p: '/register' }
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 10, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  onClick={() => handleProtectedAction(step.p)}
                  className="p-6 bg-white/10 rounded-2xl font-bold flex items-center justify-between cursor-pointer border border-transparent hover:border-white/20 transition-all"
                >
                  <span>{i + 1}. {step.s}</span>
                  <step.i className="text-secondary" size={20} />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] pointer-events-none" />
        </section>

        {/* USER ROLES - ALL PROTECTED BY LOGIN GATE */}
        <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-4 gap-6">
          {[
            { role: 'Clinics', icon: Stethoscope, path: '/clinic/dashboard' },
            { role: 'Owners', icon: Building2, path: '/owner/dashboard' },
            { role: 'Technicians', icon: ShieldCheck, path: '/tech/dashboard' },
            { role: 'Logistics', icon: Truck, path: '/logistics/dashboard' } 
          ].map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -8 }}
              onClick={() => handleProtectedAction(item.path)}
              className="glass-panel p-10 rounded-[3rem] text-center cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-secondary mb-6 mx-auto shadow-md group-hover:rotate-6 transition-transform">
                <item.icon size={26} />
              </div>
              <h4 className="text-xl font-bold group-hover:text-secondary transition-colors text-primary">{item.role}</h4>
            </motion.div>
          ))}
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="glass-panel p-12 rounded-[3.5rem] hover:shadow-xl transition-shadow border border-transparent hover:border-secondary/10">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
              <LayoutDashboard className="text-secondary" /> Features
            </h3>
            <ul className="space-y-4 font-bold text-primary/70 text-sm">
              <li className="flex items-center gap-3"><Database size={18} className="text-secondary"/> Equipment Registry</li>
              <li className="flex items-center gap-3"><Activity size={18} className="text-secondary"/> Booking Engine</li>
              <li className="flex items-center gap-3"><ArrowUpRight size={18} className="text-secondary"/> Escrow Payments</li>
              <li className="flex items-center gap-3"><ShieldCheck size={18} className="text-secondary"/> Compliance Automation</li>
            </ul>
          </div>

          <div className="glass-panel p-12 rounded-[3.5rem] bg-accent/10 hover:shadow-xl transition-shadow border border-transparent hover:border-secondary/10">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
              <ShieldCheck className="text-secondary" /> Trust
            </h3>
            <div className="flex flex-col gap-4">
              {[
                { t: "Verified Partners", i: BadgeCheck },
                { t: "Certified Equipment", i: Activity },
                { t: "Financial Protection", i: Lock }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl font-black text-[10px] uppercase hover:bg-white transition-colors cursor-default border border-transparent hover:border-secondary/10 shadow-sm text-primary">
                  <item.i className="text-secondary" size={18} /> {item.t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center">
          <h2 className="text-5xl font-black mb-10 text-primary">
            Join the future of shared healthcare infrastructure.
          </h2>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary text-white px-10 py-5 rounded-3xl font-bold hover:scale-105 transition-all shadow-xl"
            >
              Clinic Signup
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="glass-panel px-10 py-5 rounded-3xl font-bold hover:bg-white/50 transition-all shadow-md text-primary"
            >
              Owner Signup
            </button>
          </div>
        </section>

        <footer className="py-12 text-center opacity-40 text-xs font-bold tracking-[0.3em] text-primary">
          ResourceRX • Built for Impact • 2026
        </footer>
      </motion.div>
    </div>
  );
}