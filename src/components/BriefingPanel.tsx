import { X, Copy, Check, FileText, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

interface BriefingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  briefingMarkdown: string;
  buyerName: string;
  companyName: string;
  isLoading: boolean;
  isDark?: boolean;
}

export default function BriefingPanel({
  isOpen,
  onClose,
  briefingMarkdown,
  buyerName,
  companyName,
  isLoading,
  isDark = false
}: BriefingPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe custom simple Markdown element parser to structure content perfectly with exact elegant Tailwind rules
  const renderStyledContent = (text: string) => {
    if (!text) return null;

    const sections = text.split('\n\n');
    return sections.map((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return null;
      
      // Title Header
      if (trimmed.startsWith('# ')) {
        const title = trimmed.replace('# ', '').trim();
        return (
          <div key={idx} className="mb-6 p-4.5 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center gap-2 mb-1.5 relative z-10">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-[9px] tracking-widest font-mono font-bold uppercase text-indigo-300">Sales Intelligence Synthesis</span>
            </div>
            <h1 className="text-sm font-extrabold tracking-tight font-sans text-white relative z-10 uppercase">
              {title}
            </h1>
          </div>
        );
      }

      // H2 Section Headers (e.g. ## 🎯 Executive Context Grid)
      if (trimmed.startsWith('## ')) {
        const headerText = trimmed.replace('## ', '').trim();
        return (
          <div key={idx} className="mt-8 mb-4 flex items-center gap-2 border-b border-indigo-500/10 pb-2">
            <h2 className="text-xs font-black font-sans uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {headerText}
            </h2>
          </div>
        );
      }

      // H3 Objection Headers (e.g. ### OBJECTION: The CFO $100K Trap | Confidence: 95%)
      if (trimmed.startsWith('### ')) {
        const cleanHeader = trimmed.replace('### ', '').trim();
        
        if (cleanHeader.toLowerCase().includes('objection:')) {
          const objectionBody = cleanHeader.replace(/objection:/i, '').trim();
          const parts = objectionBody.split('|');
          const name = parts[0]?.trim() || "Surface Friction Pattern";
          const confidenceString = parts[1]?.replace(/confidence:/i, '')?.replace('%', '')?.trim() || "85";
          const confidence = parseInt(confidenceString) || 85;

          const isHigh = confidence >= 90;
          const isMedium = confidence >= 75 && confidence < 90;
          const riskColorClass = isHigh 
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
            : isMedium 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

          return (
            <div key={idx} className={`mt-5 p-4 rounded-t-xl border-t border-x transition-colors duration-200 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800/80 shadow-none' : 'bg-slate-50 border-slate-200/80 shadow-2xs'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isHigh 
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black font-mono tracking-widest uppercase text-slate-400 dark:text-zinc-500 block leading-tight mb-0.5">
                      PREDICTED CONFLICT VETO
                    </span>
                    <h4 className={`text-xs font-bold leading-snug ${isDark ? 'text-zinc-100' : 'text-slate-805'}`}>
                      {name}
                    </h4>
                  </div>
                </div>
                <div className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border shrink-0 ${riskColorClass}`}>
                  Confidence: {confidence}%
                </div>
              </div>
              
              {/* Meter bar */}
              <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          );
        }

        return <h3 key={idx} className={`text-xs font-bold mt-4 mb-2 flex items-center gap-1.5 font-sans ${isDark ? 'text-indigo-400' : 'text-indigo-900'}`}>{cleanHeader}</h3>;
      }

      // Blockquotes and speaking scripts / battle counterplays
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.substring(1).trim();
        
        // Check for counterplay flag
        if (quoteContent.toLowerCase().includes('counterplay')) {
          const textBody = quoteContent.replace(/^\*\*Battle-tested Counterplay:\*\*/i, '').replace(/^Battle-tested Counterplay:/i, '').trim();
          return (
            <div key={idx} className={`p-4 rounded-b-xl border-l-[3px] border-b border-r mb-4 bg-emerald-500/[0.02] border-emerald-500/20 dark:bg-emerald-950/10 dark:border-emerald-900/30 border-l-emerald-500`}>
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <span className="text-[9px] font-black font-mono tracking-widest uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    Live Response Playbook
                  </span>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    {textBody}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // Check for speaking script block
        if (quoteContent.toLowerCase().includes('speaking script')) {
          const textSpeech = quoteContent.replace(/^\*\*SDR speaking script:\*\*/i, '').replace(/^SDR speaking script:/i, '').replace(/"/g, '').trim();
          return (
            <div key={idx} className="my-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/10 dark:from-indigo-950/20 dark:to-indigo-950/5 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-600 text-white font-mono text-[7px] uppercase font-bold rounded-bl border-l border-b border-indigo-500/30 tracking-widest">
                HUMAN DIALOGUE MATRIX
              </div>
              <div className="flex gap-2.5">
                <div className="p-1.5 self-start rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div className="space-y-1 pr-14">
                  <span className="text-[8px] font-black font-mono tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                    PROVEN SPEAKING ACCENT
                  </span>
                  <p className={`text-xs italic font-semibold leading-relaxed ${isDark ? 'text-indigo-200' : 'text-slate-750'}`}>
                    "{textSpeech}"
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <blockquote key={idx} className={`my-3 pl-4 border-l-2 border-indigo-500 italic text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            {quoteContent}
          </blockquote>
        );
      }

      // Lists - Grid layouts / custom lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const lines = trimmed.split('\n');
        return (
          <div key={idx} className={`my-3.5 p-4 rounded-xl border ${
            isDark ? 'bg-zinc-950/30 border-zinc-900/80 shadow-none' : 'bg-white border-slate-200/80 shadow-2xs'
          }`}>
            <ul className="grid grid-cols-1 gap-2.5">
              {lines.map((l, lIdx) => {
                const cleanedLine = l.replace(/^[-*]\s*/, '').trim();
                let icon = <ChevronRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />;
                
                if (cleanedLine.toLowerCase().includes('champion')) {
                  icon = <svg className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
                } else if (cleanedLine.toLowerCase().includes('infrastructure') || cleanedLine.toLowerCase().includes('ecosystem') || cleanedLine.toLowerCase().includes('context') || cleanedLine.toLowerCase().includes('tech')) {
                  icon = <svg className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
                } else if (cleanedLine.toLowerCase().includes('temperature') || cleanedLine.toLowerCase().includes('status')) {
                  icon = <svg className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
                } else if (cleanedLine.toLowerCase().includes('avoid') || cleanedLine.toLowerCase().includes('not') || cleanedLine.toLowerCase().includes('never')) {
                  icon = <svg className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
                }
                
                // Bold markers
                let parts = [cleanedLine];
                if (cleanedLine.includes('**')) {
                  parts = cleanedLine.split('**');
                }

                return (
                  <li key={lIdx} className="flex items-start gap-2.5 text-xs font-sans leading-relaxed text-slate-700 dark:text-zinc-200">
                    <span className="mt-0.5">{icon}</span>
                    <span className="flex-grow">
                      {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-950 font-black'}`}>{p}</strong> : p)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      // Default clean paragraph
      return (
        <p key={idx} className={`text-xs leading-relaxed my-2.5 font-sans whitespace-pre-wrap ${isDark ? 'text-zinc-300 font-medium' : 'text-slate-600'}`}>
          {trimmed.includes('**') ? (
            trimmed.split('**').map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-900'}`}>{p}</strong> : p)
          ) : trimmed}
        </p>
      );
    });
  };

  return (
    <div id="brief-slide-over" className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      {/* Container slide over */}
      <div className={`w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-in relative transition-colors duration-200 ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
        
        {/* Top bar controls */}
        <div className="px-4 py-3 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Pre-Call Tactical Briefing</h3>
              <p className="text-[10px] text-indigo-200">Target Segment: {buyerName} @ {companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading || !briefingMarkdown}
              id="brief-copy-btn"
              className="p-1 px-2.5 text-xs bg-indigo-900 hover:bg-indigo-950 rounded border border-indigo-800 text-slate-100 font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              {copied ? 'Copied' : 'Copy Report'}
            </button>
            <button
              onClick={onClose}
              id="brief-close-btn"
              className="p-1 text-indigo-200 hover:text-white rounded transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tactical Overview Ribbon */}
        <div className="bg-indigo-900 text-indigo-100 flex items-center gap-2 py-1 px-4 text-[10px] font-mono tracking-wider uppercase border-b border-indigo-950">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Autonomous Objection Predictor & E2E Negotiation Sandbox</span>
        </div>

        {/* Primary scroll content body is here */}
        <div className={`flex-1 overflow-y-auto p-6 transition-colors duration-200 ${isDark ? 'bg-black' : 'bg-slate-50/50'}`}>
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col items-center justify-center py-20 text-xs gap-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}
            >
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>SalesIQ is mining logs and compiling tactical playbooks...</span>
            </motion.div>
          ) : !briefingMarkdown ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className={`text-center py-16 text-xs text-sans ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}
            >
              No tactical records logged yet. Begin debriefing or chat to trigger analysis.
            </motion.div>
          ) : (
            <motion.div 
              key={briefingMarkdown}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-4 max-w-none text-xs pb-10"
            >
              {renderStyledContent(briefingMarkdown)}
            </motion.div>
          )}
        </div>

        {/* Footer info ribbon */}
        <div className={`p-3 text-center text-[10px] font-mono border-t ${isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-500' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
          SalesIQ uses continuous Hindsight retention logic. Ensure key objects are updated regularly.
        </div>
      </div>
    </div>
  );
}
