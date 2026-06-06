import { useState } from 'react';
import { Sparkles, EyeOff, Bot, Zap, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import FormattedAIResponse from './FormattedAIResponse.tsx';

interface BeforeAfterResponseProps {
  beforeContent: string;
  afterContent: string;
  isDark?: boolean;
}

export default function BeforeAfterResponse({ beforeContent, afterContent, isDark = false }: BeforeAfterResponseProps) {
  // Default to 'after' (Memory ON) to avoid immediate visual clutter of dual columns
  const [activeView, setActiveView] = useState<'after' | 'before' | 'comparison'>('after');
  const [isCompareExpanded, setIsCompareExpanded] = useState(false);

  // When user clicks expand comparison, toggle between 'comparison' and 'after'
  const handleToggleComparison = () => {
    if (activeView === 'comparison') {
      setActiveView('after');
      setIsCompareExpanded(false);
    } else {
      setActiveView('comparison');
      setIsCompareExpanded(true);
    }
  };

  return (
    <div id="before-after-cmp" className={`rounded-xl overflow-hidden my-2.5 transition-all duration-200 ${
      isDark ? 'bg-zinc-950/60' : 'bg-white'
    }`}>
      {/* Sleek, tiny status bar on top */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b rounded-t-xl transition-colors duration-200 ${
        isDark ? 'bg-zinc-950/80 border-zinc-900' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold font-mono tracking-wide text-indigo-500">
            <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>SALESIQ AGENT ACTIVE</span>
          </div>
          <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded uppercase font-bold select-none ${
            isDark ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/40' : 'bg-indigo-50 text-indigo-700'
          }`}>
            Grounded Playbook Injects
          </span>
        </div>

        {/* Simplified Interaction Controls */}
        <div className="flex items-center gap-2">
          {/* Comparison Toggle Button */}
          <button
            id="cmp-btn-compare"
            onClick={handleToggleComparison}
            className={`p-1 px-2.5 rounded-lg border text-[9.5px] font-bold font-sans tracking-tight transition-all duration-200 flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-95 ${
              activeView === 'comparison'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-550'
                : (isDark ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200')
            }`}
          >
            <span>Contrast standard AI</span>
            {activeView === 'comparison' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="p-1">
        {activeView === 'comparison' && (
          <motion.div 
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 border border-t-0 rounded-b-xl border-dashed border-indigo-550/20"
          >
            {/* Standard Stateless LLM */}
            <div id="stateless-panel" className={`border rounded-xl p-4 flex flex-col justify-between transition-colors duration-200 ${
              isDark ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-slate-50/50 border-slate-200 text-slate-700 shadow-3xs'
            }`}>
              <div>
                <div className={`flex items-center gap-1.5 mb-2.5 pb-2 border-b ${isDark ? 'border-zinc-850' : 'border-slate-100'}`}>
                  <div className={`p-1 rounded-lg ${isDark ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className={`text-[10px] font-extrabold font-sans uppercase tracking-tight ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Standard GPT / Default LLM</h4>
                    <p className="text-[8.5px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Stateless (No Sales Memory)</p>
                  </div>
                </div>
                <div className="text-xs leading-relaxed space-y-2 select-text">
                  <FormattedAIResponse content={beforeContent} isDark={isDark} />
                </div>
              </div>
              <div className="mt-4 pt-1.5 border-t border-dashed border-slate-100 dark:border-zinc-850/60 flex items-center gap-1 text-[9px] font-mono font-bold text-amber-600/90 select-none">
                <span className="inline-block w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                Blinded to previous call details
              </div>
            </div>

            {/* SalesIQ with Hindsight Memory */}
            <div id="salesiq-panel" className={`border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 ${
              isDark ? 'bg-indigo-950/10 border-indigo-900/40 text-zinc-100' : 'bg-indigo-50/10 border border-indigo-100 text-slate-800 shadow-3xs'
            }`}>
              <div>
                <div className={`flex items-center gap-1.5 mb-2.5 pb-2 border-b ${isDark ? 'border-indigo-900/20' : 'border-indigo-100/50'}`}>
                  <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-3xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-350" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className={`text-[10px] font-extrabold font-sans uppercase tracking-tight ${isDark ? 'text-indigo-400' : 'text-indigo-900'}`}>Connected SalesIQ Play</h4>
                      <span className="text-[7.5px] bg-indigo-600 text-white px-1.5 py-0.2 tracking-widest rounded font-mono uppercase font-black">ACTIVE</span>
                    </div>
                    <p className={`text-[8.5px] font-mono font-bold uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-550'}`}>Recall-And-Reflect Guided</p>
                  </div>
                </div>
                <div className="text-xs leading-relaxed space-y-2 select-text">
                  <FormattedAIResponse content={afterContent} isDark={isDark} />
                </div>
              </div>
              <div className={`mt-4 pt-1.5 border-t border-dashed flex items-center justify-between text-[9px] font-mono font-bold ${
                isDark ? 'border-indigo-900/25 text-indigo-400' : 'border-indigo-105/50 text-indigo-600'
              } select-none`}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-indigo-505 animate-pulse"></span>
                  Grounded with active customer facts
                </span>
                <span className={`text-[8px] px-1.5 rounded font-black uppercase tracking-widest leading-none py-0.5 ${
                  isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-850'
                }`}>
                  Deal Ready
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'before' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`border rounded-xl p-4 transition-colors duration-200 ${
              isDark ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <div className="text-xs leading-relaxed select-text">
              <FormattedAIResponse content={beforeContent} isDark={isDark} />
            </div>
          </motion.div>
        )}

        {activeView === 'after' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-1 select-text"
          >
            {/* Direct elegant rendering of the memory-connected answer */}
            <div className="text-xs leading-relaxed">
              <FormattedAIResponse content={afterContent} isDark={isDark} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
