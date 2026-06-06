import React, { useState } from 'react';
import { X, Send, Clipboard, Flame, HelpCircle, User, Sparkles, Mic, MicOff } from 'lucide-react';
import { DebriefData } from '../types.js';

interface DebriefFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DebriefData) => Promise<void>;
  buyerId: string;
  isDark?: boolean;
}

export default function DebriefForm({ isOpen, onClose, onSubmit, buyerId, isDark = false }: DebriefFormProps) {
  const [summary, setSummary] = useState('');
  const [objections, setObjections] = useState('');
  const [signals, setSignals] = useState('');
  const [steps, setSteps] = useState('');
  const [outcome, setOutcome] = useState<'Won' | 'Lost' | 'Progressed'>('Progressed');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSpeechField, setActiveSpeechField] = useState<'summary' | 'objections' | 'signals' | 'steps' | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const startListening = (field: 'summary' | 'objections' | 'signals' | 'steps') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported on this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setActiveSpeechField(field);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setActiveSpeechField(null);
      };

      recognition.onend = () => {
        setActiveSpeechField(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (field === 'summary') {
            setSummary(prev => prev ? `${prev} ${transcript}` : transcript);
          } else if (field === 'objections') {
            setObjections(prev => prev ? `${prev} ${transcript}` : transcript);
          } else if (field === 'signals') {
            setSignals(prev => prev ? `${prev} ${transcript}` : transcript);
          } else if (field === 'steps') {
            setSteps(prev => prev ? `${prev} ${transcript}` : transcript);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setActiveSpeechField(null);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setActiveSpeechField(null);
  };

  const toggleListening = (field: 'summary' | 'objections' | 'signals' | 'steps') => {
    if (activeSpeechField === field) {
      stopListening();
    } else {
      if (activeSpeechField) {
        stopListening();
      }
      startListening(field);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        buyer_id: buyerId,
        call_summary: summary,
        objections_raised: objections,
        positive_signals: signals,
        next_steps: steps,
        outcome
      });
      
      // Reset form states
      setSummary('');
      setObjections('');
      setSignals('');
      setSteps('');
      setOutcome('Progressed');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutofillExample = () => {
    setSummary("Discovery consultation call. Reviewed their cluster configuration. Currently running AWS EKS with slow rollbacks.");
    setObjections("They raised concerns about implementation licensing and set-up latency. Need validation on Germany legal regulations.");
    setSignals("Extremely positive response to our instant automated canary rollbacks. Engineers loved the Kubernetes custom controller model.");
    setSteps("Send our EU data sovereignty whitepaper and draft separate Software Base proposal.");
    setOutcome("Progressed");
  };

  return (
    <div id="debrief-modal" className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs ${
      isDark ? 'bg-black/85' : 'bg-slate-900/60'
    }`}>
      <div className={`border text-xs rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200 ${
        isDark ? 'bg-zinc-950 border-zinc-805 text-white shadow-none' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Modal Header */}
        <div className={`px-4 py-3.5 flex items-center justify-between border-b ${
          isDark ? 'bg-black border-zinc-900 text-white' : 'bg-slate-950 text-white border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Structured Post-Call Deal Debrief</h3>
              <p className={`text-[10px] ${isDark ? 'text-zinc-550' : 'text-slate-300'}`}>Run Retain, Extract & Reflect background pipelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded cursor-pointer transition ${isDark ? 'text-zinc-405 hover:text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info ribbon */}
        <div className={`p-3 border-b flex items-center justify-between text-[11px] ${
          isDark ? 'bg-indigo-950/40 border-indigo-905 text-indigo-400' : 'bg-indigo-50 border-b border-indigo-150 text-indigo-950'
        }`}>
          <span className="flex items-center gap-1.5 leading-none">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>AI will background-extract World Facts & Experiences.</span>
          </span>
          <button
            type="button"
            onClick={handleAutofillExample}
            className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer transition"
          >
            Load Form Sample
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                What was discussed during this call? <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => toggleListening('summary')}
                className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded cursor-pointer transition ${
                  activeSpeechField === 'summary' 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : (isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-855')
                }`}
                title="Voice dictate summary"
              >
                {activeSpeechField === 'summary' ? <MicOff className="w-3 h-3 animate-pulse" /> : <Mic className="w-3 h-3" />}
                <span>{activeSpeechField === 'summary' ? 'Listening...' : 'Dictate'}</span>
              </button>
            </div>
            <textarea
              id="debrief-summary-area"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Conducted technical architectural review with engineering team..."
              className={`w-full text-xs p-2.5 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-505 transition duration-200 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-750 text-white placeholder-zinc-500 focus:bg-black focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-855 placeholder-slate-400 focus:bg-white focus:border-indigo-505'
              }`}
              rows={3}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                What objections or concerns did they push back on?
              </label>
              <button
                type="button"
                onClick={() => toggleListening('objections')}
                className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded cursor-pointer transition ${
                  activeSpeechField === 'objections' 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : (isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-855')
                }`}
                title="Voice dictate objections"
              >
                {activeSpeechField === 'objections' ? <MicOff className="w-3 h-3 animate-pulse" /> : <Mic className="w-3 h-3" />}
                <span>{activeSpeechField === 'objections' ? 'Listening...' : 'Dictate'}</span>
              </button>
            </div>
            <textarea
              id="debrief-objections-area"
              value={objections}
              onChange={(e) => setObjections(e.target.value)}
              placeholder="e.g. Price lists, lack of certified EU hosting regions, data telemetry..."
              className={`w-full text-xs p-2.5 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-505 transition duration-200 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-750 text-white placeholder-zinc-500 focus:bg-black focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-855 placeholder-slate-400 focus:bg-white focus:border-indigo-505'
              }`}
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                What buyers positive signals or exciting features stood out?
              </label>
              <button
                type="button"
                onClick={() => toggleListening('signals')}
                className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded cursor-pointer transition ${
                  activeSpeechField === 'signals' 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : (isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-855')
                }`}
                title="Voice dictate positive signals"
              >
                {activeSpeechField === 'signals' ? <MicOff className="w-3 h-3 animate-pulse" /> : <Mic className="w-3 h-3" />}
                <span>{activeSpeechField === 'signals' ? 'Listening...' : 'Dictate'}</span>
              </button>
            </div>
            <textarea
              id="debrief-signals-area"
              value={signals}
              onChange={(e) => setSignals(e.target.value)}
              placeholder="e.g. Enthusiastic on rollback triggers, champion Sarah committed to budget checks..."
              className={`w-full text-xs p-2.5 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-505 transition duration-200 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-750 text-white placeholder-zinc-500 focus:bg-black focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-855 placeholder-slate-400 focus:bg-white focus:border-indigo-505'
              }`}
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                What next actions or commitments did they agree to?
              </label>
              <button
                type="button"
                onClick={() => toggleListening('steps')}
                className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded cursor-pointer transition ${
                  activeSpeechField === 'steps' 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : (isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-855')
                }`}
                title="Voice dictate actions"
              >
                {activeSpeechField === 'steps' ? <MicOff className="w-3 h-3 animate-pulse" /> : <Mic className="w-3 h-3" />}
                <span>{activeSpeechField === 'steps' ? 'Listening...' : 'Dictate'}</span>
              </button>
            </div>
            <textarea
              id="debrief-steps-area"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="e.g. Arrange compliance sheet delivery, explore commercial Base License proposal..."
              className={`w-full text-xs p-2.5 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-505 transition duration-200 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-750 text-white placeholder-zinc-500 focus:bg-black focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-855 placeholder-slate-400 focus:bg-white focus:border-indigo-505'
              }`}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Current Outcome Status</label>
              <select
                id="debrief-status-select"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as any)}
                className={`w-full text-xs p-2.5 border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition duration-200 font-medium ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-750 text-white focus:bg-black focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-850 focus:bg-white focus:border-indigo-505'
                }`}
              >
                <option value="Progressed">Progressed (Active)</option>
                <option value="Won">Won (Deal Closed)</option>
                <option value="Lost">Lost (Deal Lost)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                id="debrief-submit-btn"
                type="submit"
                disabled={isSubmitting || !summary}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Processing...' : 'Run Extraction'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
