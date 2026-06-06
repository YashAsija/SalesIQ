import React, { useState } from 'react';
import { 
  Sparkles, Bot, Zap, Shield, HelpCircle, AlertTriangle, 
  Quote, Copy, Check, TrendingUp, Lightbulb, User, Clock, CheckCircle2 
} from 'lucide-react';

interface FormattedAIResponseProps {
  content: string;
  isDark?: boolean;
}

// --- RECURSIVE RE-FORMATTING UTILITY FOR LEAKED JSON DATA ---
const renderParsedJSON = (
  obj: any, 
  isDark: boolean, 
  handleCopy: (text: string, index: number) => void, 
  copiedIndex: number | null
): React.ReactNode => {
  if (typeof obj !== 'object' || obj === null) {
    return <p className="text-xs select-text font-medium">{String(obj)}</p>;
  }

  // If it is an array
  if (Array.isArray(obj)) {
    return (
      <div className="space-y-2.5 my-2">
        {obj.map((item, idx) => (
          <div key={idx} className={`p-3 border rounded-xl shadow-3xs ${isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-300' : 'bg-white border-slate-200 text-slate-800'}`}>
            {typeof item === 'object' ? renderParsedJSON(item, isDark, handleCopy, copiedIndex) : <p className="text-xs leading-relaxed font-sans">{String(item)}</p>}
          </div>
        ))}
      </div>
    );
  }

  const elements: React.ReactNode[] = [];
  const renderedKeys = new Set<string>();

  // Extract explicit speech scripts or speaking lines
  const scriptKeys = ['script', 'speakingscript', 'speaking_script', 'prompt', 'talkingscript'];
  const sKey = Object.keys(obj).find(k => scriptKeys.includes(k.toLowerCase().replace(/[^a-z]/g, '')) && typeof obj[k] === 'string');
  if (sKey) {
    elements.push(
      <div key="json-script" className={`my-3 border rounded-2xl p-4 relative flex gap-3 shadow-3xs transition-all ${
        isDark ? 'bg-zinc-950 border-indigo-950 text-indigo-200' : 'bg-indigo-50/40 border border-indigo-150/80 text-indigo-950'
      }`}>
        <div className="p-2 bg-indigo-500/10 text-indigo-650 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
          <Quote className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1 flex-grow pr-7 select-text">
          <span className={`text-[9px] font-bold font-mono uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-805'}`}>
            Live Speaking Prompt Script
          </span>
          <p className="text-[12px] font-sans italic font-medium leading-relaxed">
            &ldquo;{obj[sKey]}&rdquo;
          </p>
        </div>
        <button
          onClick={() => handleCopy(obj[sKey], 99999)}
          className={`absolute top-3.5 right-3.5 p-1.5 rounded-lg border transition ${
            isDark ? 'bg-zinc-90 w-7 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 border-zinc-800' : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title="Copy script"
        >
          {copiedIndex === 99999 ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
    renderedKeys.add(sKey);
  }

  // Extract primary content body
  const responseKeys = ['reply', 'response', 'text', 'answer', 'message', 'content', 'body'];
  const pKey = Object.keys(obj).find(k => responseKeys.includes(k.toLowerCase()) && typeof obj[k] === 'string');
  if (pKey) {
    elements.push(
      <p key="json-response-text" className={`text-xs leading-relaxed my-2.5 select-text ${isDark ? 'text-zinc-200 font-sans' : 'text-slate-700 font-sans'}`}>
        {obj[pKey]}
      </p>
    );
    renderedKeys.add(pKey);
  }

  // Extract Objections list
  const objKeys = ['objections', 'objection', 'risks', 'risk'];
  const oKey = Object.keys(obj).find(k => objKeys.includes(k.toLowerCase().replace(/[^a-z]/g, '')));
  if (oKey) {
    const arr = Array.isArray(obj[oKey]) ? obj[oKey] : [obj[oKey]];
    elements.push(
      <div key="json-objections" className="my-3 space-y-2">
        <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider block ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Buyer Objections Identified</span>
        {arr.map((val: any, idx: number) => (
          <div key={idx} className={`p-3 border rounded-xl flex gap-2.5 shadow-2xs ${isDark ? 'bg-amber-950/10 border-amber-900/40 text-amber-200' : 'bg-amber-50/20 border-amber-150 text-slate-800'}`}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-xs leading-normal select-text">{String(val)}</p>
          </div>
        ))}
      </div>
    );
    renderedKeys.add(oKey);
  }

  // Extract Counterplays / Battlecards
  const counterplayKeys = ['counterplays', 'counterplay', 'battlecard', 'battlecards', 'play', 'plays'];
  const cKey = Object.keys(obj).find(k => counterplayKeys.includes(k.toLowerCase().replace(/[^a-z]/g, '')));
  if (cKey) {
    const arr = Array.isArray(obj[cKey]) ? obj[cKey] : [obj[cKey]];
    elements.push(
      <div key="json-counterplays" className="my-3 space-y-2">
        <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Battle-Tested Playbook Counterplays</span>
        {arr.map((val: any, idx: number) => (
          <div key={idx} className={`p-3 border rounded-xl flex gap-2.5 shadow-2xs ${isDark ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-250' : 'bg-emerald-50/20 border border-emerald-200 text-slate-850'}`}>
            <Lightbulb className="w-4 h-4 text-emerald-505 shrink-0 mt-0.5" />
            <p className="text-xs leading-normal select-text">{String(val)}</p>
          </div>
        ))}
      </div>
    );
    renderedKeys.add(cKey);
  }

  // Render other remaining fields
  Object.keys(obj).forEach(key => {
    if (renderedKeys.has(key)) return;
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      elements.push(
        <div key={key} className="my-3">
          <span className="text-[9px] font-mono uppercase font-bold text-zinc-550 tracking-wide block mb-1.5">{key}</span>
          {renderParsedJSON(value, isDark, handleCopy, copiedIndex)}
        </div>
      );
    } else {
      elements.push(
        <div key={key} className={`p-2.5 border rounded-xl my-2 flex justify-between gap-4 text-xs transition shadow-3xs ${
          isDark ? 'bg-zinc-950/25 border-zinc-900 text-zinc-300' : 'bg-white border-slate-150 text-slate-700'
        }`}>
          <span className="font-mono font-bold text-zinc-450 select-none uppercase tracking-wider text-[9px]">{key}:</span>
          <span className="select-text font-medium text-right">{String(value)}</span>
        </div>
      );
    }
  });

  return <div className="space-y-1.5 select-text font-sans">{elements}</div>;
};

export default function FormattedAIResponse({ content, isDark = false }: FormattedAIResponseProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) {
    return <p className="text-zinc-500 italic text-xs">No response generated.</p>;
  }

  // Check if content matches a loaded JSON tree directly
  let jsonParsed: any = null;
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      jsonParsed = JSON.parse(trimmed);
    } catch (e) {
      // Not valid, fallback to normal parser
    }
  }

  // Also check if wrapped in markdown code fences
  if (!jsonParsed) {
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        jsonParsed = JSON.parse(jsonBlockMatch[1].trim());
      } catch (e) {
        // Fallback
      }
    }
  }

  // Intercept and load custom JSON viewer if successfully parsed
  if (jsonParsed) {
    return (
      <div className="space-y-1.5 select-text font-sans">
        {renderParsedJSON(jsonParsed, isDark, handleCopy, copiedIndex)}
      </div>
    );
  }

  // --- REGEX & PARSING ENGINE ---
  // We want to extract sections, lists, quote blocks, speaking scripts, and general body paragraphs.
  
  // Helper to strip markdown asterisks from headers
  const cleanMarkdown = (text: string) => {
    return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  };

  // Render text containing inline bold markers (**texto**)
  const renderInlineMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={index} 
            className={`font-semibold tracking-tight ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Breakdown lines
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentGroup: { type: 'list'; items: { number: string; title: string; body: string }[] } | null = null;
  let introLines: string[] = [];

  // Helper to commit accumulated list group
  const commitGroup = () => {
    if (currentGroup && currentGroup.items.length > 0) {
      const items = currentGroup.items;
      renderedElements.push(
        <div key={`list-group-${renderedElements.length}`} className="grid grid-cols-1 gap-3.5 my-3.5">
          {items.map((item, idx) => {
            // Determine an icon based on title keywords
            let Icon = CheckCircle2;
            let themeColor = isDark ? 'border-zinc-805 bg-black' : 'border-slate-200 bg-white';
            let iconColor = 'text-indigo-500';

            const lowerTitle = item.title.toLowerCase();
            if (lowerTitle.includes('cfo') || lowerTitle.includes('board') || lowerTitle.includes('pricing') || lowerTitle.includes('trap')) {
              Icon = TrendingUp;
              themeColor = isDark ? 'border-amber-950/50 bg-amber-950/10' : 'border-amber-200 bg-amber-50/10';
              iconColor = 'text-amber-500';
            } else if (lowerTitle.includes('gdpr') || lowerTitle.includes('secure') || lowerTitle.includes('sovereignty') || lowerTitle.includes('data')) {
              Icon = Shield;
              themeColor = isDark ? 'border-emerald-950/50 bg-emerald-950/10' : 'border-emerald-200 bg-emerald-50/10';
              iconColor = 'text-emerald-500';
            } else if (lowerTitle.includes('poc') || lowerTitle.includes('speed') || lowerTitle.includes('deploy') || lowerTitle.includes('momentum')) {
              Icon = Clock;
              themeColor = isDark ? 'border-indigo-950/40 bg-indigo-950/10' : 'border-indigo-250/20 bg-indigo-55/10';
              iconColor = 'text-indigo-400';
            }

            return (
              <div 
                key={idx} 
                className={`border rounded-xl p-3.5 shadow-3xs hover:shadow-xs transition-all duration-200 flex gap-3 ${themeColor}`}
              >
                <div className={`p-2 rounded-lg h-9 w-9 flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-zinc-900/80 text-zinc-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-indigo-600/10 text-indigo-500 px-1.5 py-0.5 rounded">
                      STEP {item.number}
                    </span>
                    <h5 className={`text-xs font-bold leading-tight ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
                      {item.title}
                    </h5>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-650'}`}>
                    {renderInlineMarkdown(item.body)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      );
      currentGroup = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Detect Battle-tested Counterplays (> **Battle-tested Counterplay:**)
    if (line.startsWith('>') && (line.includes('Counterplay') || line.includes('counterplay'))) {
      commitGroup();
      const rawText = line.replace(/^>\s*/, '');
      const cleanText = rawText.replace(/\*\*Battle-tested Counterplay:\*\*/i, '').replace(/\*\*Battle-tested Counterplay\*\*/i, '').trim();
      
      renderedElements.push(
        <div key={`counterplay-${i}`} className={`my-3 p-4 border rounded-xl flex gap-3.5 ${
          isDark 
            ? 'bg-amber-950/20 border-amber-900 text-zinc-200' 
            : 'bg-amber-50/50 border-amber-200 text-slate-800'
        }`}>
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1 select-text">
            <span className={`text-[9px] font-bold font-mono tracking-wider uppercase block ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}>
              Battle-tested Counterplay
            </span>
            <p className="text-xs leading-relaxed">
              {renderInlineMarkdown(cleanText)}
            </p>
          </div>
        </div>
      );
      continue;
    }

    // 2. Detect SDR speaking scripts (> **SDR speaking script:**)
    if (line.startsWith('>') && (line.includes('script:') || line.includes('Script') || line.includes('speaking script'))) {
      commitGroup();
      const rawText = line.replace(/^>\s*/, '');
      const cleanText = rawText.replace(/\*\*SDR speaking script:\*\*/i, '').replace(/\*\*SDR speaking script\*\*/i, '').trim();
      
      // Look forward to consolidate multiple quote lines if any
      let consolidatedScript = cleanText.replace(/"/g, ''); // strip unnecessary quotes at boundaries
      
      const elementIdx = i;
      renderedElements.push(
        <div key={`script-${i}`} className={`my-3.5 border rounded-2xl p-4 shadow-sm relative flex gap-3.5 transition-all ${
          isDark 
            ? 'bg-zinc-950 border-indigo-900/50 text-indigo-200' 
            : 'bg-indigo-50/40 border border-indigo-150/80 text-indigo-950'
        }`}>
          <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl h-9 w-9 flex items-center justify-center shrink-0">
            <Quote className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-grow min-w-0 pr-6 select-text">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] font-bold font-mono uppercase tracking-widest ${
                isDark ? 'text-indigo-400' : 'text-indigo-800'
              }`}>
                Live Speaking Prompt Script
              </span>
              <span className="text-[8px] bg-emerald-500 text-white px-1 rounded font-mono uppercase font-bold">Recommended</span>
            </div>
            <p className="text-[12px] font-sans leading-relaxed tracking-tight italic font-medium">
              &ldquo;{renderInlineMarkdown(consolidatedScript)}&rdquo;
            </p>
          </div>
          <button
            onClick={() => handleCopy(consolidatedScript, elementIdx)}
            className={`absolute top-3 right-3 p-1.5 rounded-lg border transition duration-200 shrink-0 ${
              isDark 
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800' 
                : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="Copy script to clipboard"
          >
            {copiedIndex === elementIdx ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 animate-none" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      );
      continue;
    }

    // 3. Detect standard markdown blockquotes (general >)
    if (line.startsWith('>')) {
      commitGroup();
      const blockquoteText = line.replace(/^>\s*/, '').trim();
      renderedElements.push(
        <blockquote key={`quote-${i}`} className={`my-3 pl-3.5 border-l-4 italic text-xs leading-relaxed select-text ${
          isDark ? 'border-zinc-700 text-zinc-400' : 'border-slate-350 text-slate-550'
        }`}>
          {renderInlineMarkdown(blockquoteText)}
        </blockquote>
      );
      continue;
    }

    // 4. Detect Numeric lists (e.g. 1. **Title**: Body or 1. Title)
    // Supports formats like "1. **Avoid CFO**: Avoid ..."
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      const numStr = numListMatch[1];
      const rest = numListMatch[2].trim();
      
      let title = "";
      let body = rest;

      // Check if it has a bold title split by colon, double asterisks, or dash
      const boldTitleColonMatch = rest.match(/^\*\*(.*?)\*\*[:\s-]\s*(.*)/);
      if (boldTitleColonMatch) {
        title = boldTitleColonMatch[1];
        body = boldTitleColonMatch[2];
      } else {
        // Fallback to splitting by colon if no asterisks
        const firstColonIdx = rest.indexOf(':');
        if (firstColonIdx !== -1 && firstColonIdx < 35) {
          title = rest.substring(0, firstColonIdx).trim();
          body = rest.substring(firstColonIdx + 1).trim();
        }
      }

      const cleanTitleText = title || `Objective Strategy ${numStr}`;

      if (!currentGroup) {
        currentGroup = { type: 'list', items: [] };
      }
      currentGroup.items.push({ number: numStr, title: cleanTitleText, body });
      continue;
    }

    // 5. Detect bullet points
    if (line.startsWith('-') || line.startsWith('*')) {
      commitGroup();
      const rawBulletText = line.replace(/^[-*]\s*/, '').trim();
      const boldBulletMatch = rawBulletText.match(/^\*\*(.*?)\*\*[:\s-]\s*(.*)/);
      
      let bulletTitle = "";
      let bulletBody = rawBulletText;
      if (boldBulletMatch) {
        bulletTitle = boldBulletMatch[1];
        bulletBody = boldBulletMatch[2];
      }

      renderedElements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-2 pl-2">
          <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
            isDark ? 'bg-indigo-400' : 'bg-indigo-600'
          }`}></span>
          <p className="text-xs leading-relaxed">
            {bulletTitle && (
              <strong className={`font-bold mr-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                {bulletTitle}:
              </strong>
            )}
            {renderInlineMarkdown(bulletBody)}
          </p>
        </div>
      );
      continue;
    }

    // 6. Detect Headings
    if (line.startsWith('#')) {
      commitGroup();
      const level = line.match(/^#+/)?.[0].length || 1;
      const headingText = cleanMarkdown(line.replace(/^#+/, ''));
      
      if (level === 1) {
        renderedElements.push(
          <h2 key={`h-${i}`} className={`text-base font-extrabold uppercase tracking-tight mt-4 mb-2 pb-1.5 border-b font-sans ${
            isDark ? 'text-indigo-400 border-zinc-850' : 'text-indigo-855 border-slate-200'
          }`}>
            {headingText}
          </h2>
        );
      } else if (level === 2) {
        renderedElements.push(
          <h3 key={`h-${i}`} className={`text-xs font-extrabold uppercase mt-3.5 mb-1.5 tracking-wider font-mono flex items-center gap-1.5 ${
            isDark ? 'text-indigo-305' : 'text-indigo-800'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>{headingText}</span>
          </h3>
        );
      } else {
        renderedElements.push(
          <h4 key={`h-${i}`} className={`text-xs font-bold font-sans mt-3 mb-1 ${
            isDark ? 'text-zinc-200' : 'text-slate-850'
          }`}>
            {headingText}
          </h4>
        );
      }
      continue;
    }

    // Default to plain paragraph, collect intro text if at the top
    commitGroup();
    renderedElements.push(
      <p key={`p-${i}`} className={`text-xs leading-relaxed my-2 select-text ${
        isDark ? 'text-zinc-300' : 'text-slate-655'
      }`}>
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  // Final commit of any open groups
  commitGroup();

  return (
    <div className="space-y-1.5 font-sans">
      {renderedElements}
    </div>
  );
}
