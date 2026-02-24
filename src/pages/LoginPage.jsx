import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, Mail, Lock, ArrowLeft, 
  Stethoscope, Building2, ShieldCheck, Truck, ChevronRight 
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Login Form, 2 = Role Selection
  const [loading, setLoading] = useState(false);

  // This simulates the login process
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      setStep(2); // Move to role selection
    }, 1200);
  };

  const roles = [
    { name: 'Clinic Portal', desc: 'Request & manage equipment', icon: Stethoscope, path: '/clinic/dashboard', color: 'bg-blue-50' },
    { name: 'Owner Portal', desc: 'List & track your assets', icon: Building2, path: '/owner/dashboard', color: 'bg-emerald-50' },
    { name: 'Technician', desc: 'Maintenance & verification', icon: ShieldCheck, path: '/tech/dashboard', color: 'bg-purple-50' },
    { name: 'Logistics', icon: Truck, desc: 'Transport & delivery', path: '/logistics/dashboard', color: 'bg-orange-50' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorative Glows - Matches your Landing Page */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] -z-10" />

      <button 
        onClick={() => navigate('/')}
        className="absolute top-10 left-10 flex items-center gap-2 text-sm font-bold text-primary/40 hover:text-secondary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* STEP 1: LOGIN FORM */
          <motion.div 
            key="login-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-white/60"
          >
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black tracking-tighter text-primary">Login</h2>
              <p className="text-sm font-medium text-gray-500 mt-2">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60" size={18} />
                  <input 
                    required type="email" placeholder="Email Address"
                    className="w-full bg-white/50 border border-white/80 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-secondary/10 transition-all font-medium text-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60" size={18} />
                  <input 
                    required type="password" placeholder="Password"
                    className="w-full bg-white/50 border border-white/80 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-secondary/10 transition-all font-medium text-primary"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-70"
              >
                {loading ? "Authenticating..." : <><LogIn size={20} /> Sign In</>}
              </button>
            </form>
          </motion.div>
        ) : (
          /* STEP 2: ROLE SELECTION */
          <motion.div 
            key="role-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel w-full max-w-2xl p-12 rounded-[3.5rem] shadow-2xl border border-white/60 text-center"
          >
            <div className="mb-10">
              <h2 className="text-4xl font-black tracking-tighter text-primary">Identify Your Portal</h2>
              <p className="text-gray-500 font-medium mt-2 text-lg">Select the environment you want to manage today</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {roles.map((role, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.8)' }}
                  onClick={() => navigate(role.path)}
                  className="p-6 rounded-[2rem] border border-white/60 bg-white/40 text-left flex items-start gap-4 group transition-all"
                >
                  <div className={`p-3 rounded-xl ${role.color} text-secondary group-hover:scale-110 transition-transform`}>
                    <role.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-primary flex items-center justify-between">
                      {role.name}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-1">{role.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}