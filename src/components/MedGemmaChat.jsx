import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, Send, Loader2, ChevronDown, Sparkles } from 'lucide-react';

// ── API call (local Ollama via Express backend) ───────────────────────────────
async function askMedGemma(messages) {
  // Build a single prompt from conversation history
  const system = `You are MedGemma, a clinical operations AI for ResourceRX — a medical equipment sharing network between hospitals. Help with equipment needs, utilization advice, maintenance, compliance, and clinical context. Be concise and practical. Never give direct patient-specific medical advice.`;
  
  const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const prompt = `${system}\n\n${history}\n\nAssistant:`;

  try {
    const res = await fetch('http://localhost:5000/api/medgemma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    return data.response || "Sorry, I couldn't process that request.";
  } catch (err) {
    console.error('[MedGemmaChat]', err.message);
    return "Backend unavailable. Make sure the server is running on port 5000.";
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  "What equipment do I need for a 3-bed NICU expansion?",
  "Is 97% utilization rate too high for our ICU?",
  "What should I check before accepting a loaned MRI?",
  "How do I justify equipment sharing to hospital admin?",
];

export default function MedGemmaChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pulse, setPulse]       = useState(true);
  const bottomRef               = useRef(null);

  // Stop pulsing after first open
  const handleOpen = () => {
    setOpen(true);
    setPulse(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await askMedGemma(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Connection issue — please check your API key in the .env file and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleOpen}
              className="relative w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-secondary transition-colors group"
            >
              {pulse && (
                <span className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-30" />
              )}
              <BrainCircuit size={28} className="group-hover:scale-110 transition-transform" />
              {/* Tooltip */}
              <div className="absolute right-full mr-3 bottom-1/2 translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Ask MedGemma
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-50 w-[420px] max-w-[calc(100vw-2rem)] flex flex-col"
            style={{ maxHeight: '82vh' }}
          >
            {/* Glass card */}
            <div className="glass-panel rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/60" style={{ maxHeight: '82vh' }}>

              {/* Header */}
              <div className="bg-primary text-white px-8 py-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-2xl flex items-center justify-center">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <p className="font-black text-sm">MedGemma Assistant</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[9px] font-black opacity-50 uppercase tracking-wider">HAI-DEF · Online</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">

                {/* Welcome state */}
                {messages.length === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <BrainCircuit size={16} className="text-secondary" />
                      </div>
                      <div className="bg-white/60 rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                        <p className="text-sm font-medium leading-relaxed">
                          Hi, I'm MedGemma — your clinical operations AI. I can help with equipment needs, utilization analysis, compliance questions, and more.
                        </p>
                        <p className="text-[9px] font-black opacity-30 uppercase mt-2">Powered by Google HAI-DEF</p>
                      </div>
                    </div>

                    {/* Starter prompts */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[9px] font-black uppercase opacity-30 tracking-widest px-1">Suggested questions</p>
                      {STARTER_PROMPTS.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(prompt)}
                          className="w-full text-left p-3 bg-white/40 rounded-2xl border border-white hover:border-secondary/30 hover:bg-secondary/5 transition-all text-[11px] font-bold flex items-center gap-2 group"
                        >
                          <Sparkles size={11} className="text-secondary opacity-50 group-hover:opacity-100 shrink-0" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation */}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <BrainCircuit size={14} className="text-secondary" />
                      </div>
                    )}
                    <div className={`rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none font-medium'
                        : 'bg-white/60 rounded-tl-none font-medium'
                    }`}>
                      {/* Render newlines as <br> */}
                      {msg.content.split('\n').map((line, j) => (
                        <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <BrainCircuit size={14} className="text-secondary" />
                    </div>
                    <div className="bg-white/60 rounded-2xl rounded-tl-none p-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold opacity-50">
                        <Loader2 size={12} className="animate-spin" />
                        Analyzing...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-6 pb-6 pt-2 shrink-0">
                <div className="flex gap-3 bg-white/60 rounded-2xl p-2 border border-white">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask about equipment, protocols, utilization..."
                    className="flex-1 bg-transparent outline-none text-sm font-medium px-3 placeholder:opacity-40"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30 shrink-0"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                <p className="text-[8px] font-black opacity-20 uppercase text-center mt-2 tracking-wider">
                  For clinical guidance only · Not a substitute for medical advice
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}