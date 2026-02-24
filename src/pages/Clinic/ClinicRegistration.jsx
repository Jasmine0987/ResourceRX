import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Upload, ChevronRight, CheckCircle, Loader2, AlertCircle, X, Building2, MapPin, User } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import '../../App.css';

const STEPS = ['Identity', 'Facility', 'Documents', 'Review'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-12">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all ${i <= current ? 'opacity-100' : 'opacity-25'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${i < current ? 'bg-emerald-500 text-white' : i === current ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className="hidden md:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 transition-all ${i < current ? 'bg-emerald-400' : 'bg-primary/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── FIXED: Field is defined OUTSIDE the component so it's a stable reference
//    and doesn't remount on every keystroke (causing one-letter-at-a-time bug)
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, field, placeholder, type = 'text', value, onChange, error }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase ml-1 opacity-40 tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full glass-panel bg-white/40 p-5 rounded-2xl outline-none border-2 transition-all font-bold text-sm ${error ? 'border-red-400' : 'border-transparent focus:border-secondary/40'}`}
      />
      {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
    </div>
  );
}

const SPECIALTIES = ['Radiology', 'Cardiology', 'Oncology', 'Neurology', 'Nephrology', 'Orthopedics', 'Pediatrics', 'Emergency Medicine'];

export default function ClinicRegistration() {
  const navigate = useNavigate();
  const { setClinic } = useClinic();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [clinicData, setClinicData] = useState(null);

  const [form, setForm] = useState({
    clinicName: '', licenseId: '', contactName: '',
    email: '', phone: '',
    address: '', city: '', state: '', country: '',
    bedCount: '', specialties: [],
    documentFile: null,
  });

  // ── FIXED: useCallback so this function reference is stable ──
  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  const toggleSpecialty = (s) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s]
    }));
  };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.clinicName.trim()) e.clinicName = 'Required';
      if (!form.licenseId.trim())  e.licenseId  = 'Required';
      if (!form.email.includes('@')) e.email    = 'Valid email required';
      if (!form.contactName.trim()) e.contactName = 'Required';
    }
    if (step === 1) {
      if (!form.address.trim())  e.address  = 'Required';
      if (!form.city.trim())     e.city     = 'Required';
      if (!form.bedCount)        e.bedCount = 'Required';
    }
    if (step === 2) {
      if (!uploadedFile) e.documentFile = 'Please upload registration document';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    const clinic = {
      name: form.clinicName,
      licenseId: form.licenseId,
      email: form.email,
      contact: form.contactName,
      city: form.city,
      state: form.state,
      country: form.country,
      bedCount: form.bedCount,
      specialties: form.specialties,
      verified: false,
      id: `CLN-${Math.floor(Math.random() * 9000) + 1000}`,
    };
    setClinic(clinic);
    setClinicData(clinic);
    setSubmitting(false);
    // ── FIXED: Show success screen instead of immediately jumping to dashboard ──
    setSubmitted(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedFile(file); setErrors(prev => ({ ...prev, documentFile: null })); }
  };

  // ── FIXED: Success screen shown after registration ──────────────────────────
  if (submitted && clinicData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pt-20 pb-20 px-6 max-w-2xl mx-auto text-center"
      >
        <div className="glass-panel rounded-[3rem] p-16 space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle className="text-white" size={48} />
          </motion.div>

          <div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Application Submitted!</h2>
            <p className="text-gray-500 font-bold">Your clinic has been registered and is pending review</p>
          </div>

          {/* Summary card */}
          <div className="glass-panel rounded-[2rem] p-8 text-left space-y-4">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Registration Summary</p>
            {[
              { icon: Building2, label: "Clinic", value: clinicData.name },
              { icon: User,      label: "Contact", value: `${form.contactName} · ${clinicData.email}` },
              { icon: MapPin,    label: "Location", value: `${clinicData.city}${clinicData.state ? ', ' + clinicData.state : ''} ${clinicData.country}` },
              { icon: ShieldCheck, label: "Clinic ID", value: clinicData.id },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-3 bg-white/40 rounded-xl">
                <Icon size={16} className="text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black opacity-40 uppercase">{label}</p>
                  <p className="text-sm font-black truncate">{value}</p>
                </div>
              </div>
            ))}
            {clinicData.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {clinicData.specialties.map(s => (
                  <span key={s} className="text-[8px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded-full uppercase">{s}</span>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-left">
            <p className="text-xs font-bold text-amber-700">
              ⏱ Manual verification takes up to 24 hours. You'll receive a confirmation at <strong>{clinicData.email}</strong>. You can access limited features in the meantime.
            </p>
          </div>

          <button
            onClick={() => navigate('/clinic')}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm hover:bg-secondary transition-all flex items-center justify-center gap-2"
          >
            Continue to Dashboard <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-20 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-10 ml-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase mb-4">
          <ShieldCheck size={14} className="text-secondary" /> Trust & Verification
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Clinic Onboarding</h2>
        <p className="text-gray-500 font-bold">Join the ResourceRX network in 4 steps</p>
      </div>

      <StepIndicator current={step} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">

            {/* STEP 0: Identity */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel rounded-[3rem] p-10 space-y-6">
                <h3 className="text-xl font-black tracking-tighter mb-2">Identity & Contact</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* ── FIXED: All Field components now use stable props instead of 
                      being re-created inside render — no more one-letter-at-a-time ── */}
                  <Field label="Official Clinic Name"  field="clinicName"   placeholder="e.g. St. Mary's Medical Center" value={form.clinicName}   onChange={handleFieldChange} error={errors.clinicName} />
                  <Field label="Medical License ID"    field="licenseId"    placeholder="e.g. ML-2024-00128"             value={form.licenseId}    onChange={handleFieldChange} error={errors.licenseId} />
                  <Field label="Primary Contact Name"  field="contactName"  placeholder="Dr. Jane Smith"                 value={form.contactName}  onChange={handleFieldChange} error={errors.contactName} />
                  <Field label="Official Email"        field="email"        placeholder="admin@clinic.org" type="email"  value={form.email}        onChange={handleFieldChange} error={errors.email} />
                  <Field label="Phone Number"          field="phone"        placeholder="+1 (555) 000-0000" type="tel"   value={form.phone}        onChange={handleFieldChange} error={errors.phone} />
                </div>
              </motion.div>
            )}

            {/* STEP 1: Facility */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel rounded-[3rem] p-10 space-y-6">
                <h3 className="text-xl font-black tracking-tighter mb-2">Facility Details</h3>
                <Field label="Street Address" field="address"   placeholder="123 Medical Drive"  value={form.address}   onChange={handleFieldChange} error={errors.address} />
                <div className="grid md:grid-cols-3 gap-6">
                  <Field label="City"         field="city"     placeholder="Chicago"             value={form.city}     onChange={handleFieldChange} error={errors.city} />
                  <Field label="State/Region" field="state"    placeholder="IL"                  value={form.state}    onChange={handleFieldChange} error={errors.state} />
                  <Field label="Country"      field="country"  placeholder="USA"                 value={form.country}  onChange={handleFieldChange} error={errors.country} />
                </div>
                <Field label="Bed Count" field="bedCount" placeholder="e.g. 250" type="number" value={form.bedCount} onChange={handleFieldChange} error={errors.bedCount} />
                <div>
                  <label className="text-[10px] font-black uppercase ml-1 opacity-40 tracking-widest block mb-3">Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(s => (
                      <button key={s} onClick={() => toggleSpecialty(s)}
                        className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase transition-all border-2 ${form.specialties.includes(s) ? 'bg-secondary text-white border-secondary' : 'glass-panel border-transparent'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Documents */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel rounded-[3rem] p-10 space-y-6">
                <h3 className="text-xl font-black tracking-tighter mb-2">Upload Documentation</h3>
                <input type="file" id="docUpload" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="docUpload"
                  className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer group transition-all block ${uploadedFile ? 'border-emerald-400/50 bg-emerald-50/30' : errors.documentFile ? 'border-red-400/50' : 'border-white/50 hover:bg-white/40'}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:scale-110 transition-transform ${uploadedFile ? 'bg-emerald-500 text-white' : 'bg-white text-secondary'}`}>
                    {uploadedFile ? <CheckCircle size={28} /> : <Upload size={28} />}
                  </div>
                  {uploadedFile ? (
                    <>
                      <p className="text-lg font-black text-emerald-700">{uploadedFile.name}</p>
                      <p className="text-sm text-emerald-600 font-bold">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-black">Upload Hospital Registration</p>
                      <p className="text-sm text-gray-400 font-bold">PDF, JPEG, PNG · Max 10MB</p>
                    </>
                  )}
                </label>
                {errors.documentFile && <p className="text-[10px] text-red-500 font-bold">{errors.documentFile}</p>}
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-700">Documents are reviewed within 24 hours. Your clinic will be fully activated after manual verification by our compliance team.</p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel rounded-[3rem] p-10 space-y-6">
                <h3 className="text-xl font-black tracking-tighter mb-2">Review & Submit</h3>
                {[
                  { label: 'Clinic',      value: form.clinicName },
                  { label: 'License ID',  value: form.licenseId },
                  { label: 'Contact',     value: `${form.contactName} · ${form.email}` },
                  { label: 'Phone',       value: form.phone || '—' },
                  { label: 'Location',    value: `${form.address}, ${form.city}, ${form.state} ${form.country}` },
                  { label: 'Bed Count',   value: form.bedCount },
                  { label: 'Specialties', value: form.specialties.join(', ') || 'None selected' },
                  { label: 'Document',    value: uploadedFile?.name || '—' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-start p-4 bg-white/40 rounded-2xl border border-white">
                    <p className="text-[10px] font-black uppercase opacity-40 shrink-0 mr-4">{row.label}</p>
                    <p className="text-sm font-bold text-right">{row.value}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-6">
            {step > 0 && (
              <button onClick={back} className="flex-1 glass-panel py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all">
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={next} className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-secondary transition-all flex items-center justify-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit for Review <CheckCircle size={16} /></>}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel bg-primary text-white p-10 rounded-[3rem] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><ShieldCheck size={160} /></div>
            <ShieldCheck className="mb-6 text-secondary" size={40} />
            <h4 className="text-2xl font-black mb-4 tracking-tight">Why Verify?</h4>
            <p className="text-sm opacity-70 leading-relaxed font-medium mb-8">
              We maintain a closed loop of certified medical professionals to ensure equipment safety and legal compliance.
            </p>
            <div className="space-y-3">
              {["Bank-grade Security", "Manual Review Within 24h", "HIPAA Data Handling", "Instant Network Access Post-Approval"].map((text) => (
                <div key={text} className="flex items-center gap-3 text-xs font-black uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />{text}
                </div>
              ))}
            </div>
          </div>

          {form.clinicName && (
            <div className="glass-panel p-6 rounded-[2rem] space-y-2">
              <p className="text-[9px] font-black uppercase opacity-30 tracking-widest">Preview</p>
              <p className="font-black">{form.clinicName}</p>
              {form.city && <p className="text-sm opacity-50 font-bold">{form.city}{form.country ? ', ' + form.country : ''}</p>}
              {form.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {form.specialties.slice(0, 3).map(s => (
                    <span key={s} className="text-[8px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded-full uppercase">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}