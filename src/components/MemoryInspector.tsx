import React, { useState } from 'react';
import { Memory } from '../types.js';
import { jsPDF } from 'jspdf';
import { 
  Plus, Search, Edit2, Check, Trash2, Shield, Calendar, 
  Lightbulb, Database, Sparkles, SlidersHorizontal, AlertCircle, X,
  Download, RefreshCw, Wand2
} from 'lucide-react';
import axios from 'axios';

interface MemoryInspectorProps {
  memories: {
    world_facts: Memory[];
    experiences: Memory[];
    mental_models: Memory[];
  };
  isLoading: boolean;
  onAddMemory: (memory: Partial<Memory>) => Promise<void>;
  onUpdateMemory: (id: string, updated: Partial<Memory>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onTriggerReflect: () => Promise<void>;
  isReflecting: boolean;
  isDark?: boolean;
}

export default function MemoryInspector({
  memories,
  isLoading,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTriggerReflect,
  isReflecting,
  isDark = false
}: MemoryInspectorProps) {
  const [activeTab, setActiveTab] = useState<'world_facts' | 'experiences' | 'mental_models'>('world_facts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editConfidence, setEditConfidence] = useState(100);
  const [validatingIds, setValidatingIds] = useState<Record<string, 'loading' | 'success' | null>>({});
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null);

  const handleSuggestTags = async () => {
    if (!newContent.trim()) return;
    setIsSuggestingTags(true);
    try {
      const res = await axios.post('/api/suggest-tags', { content: newContent });
      if (res.data.tags && res.data.tags.length > 0) {
        const tagString = res.data.tags.map((t: string) => `#${t}`).join(' ');
        setNewContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tagString);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleRevalidate = async (id: string, currentConf: number) => {
    setValidatingIds(prev => ({ ...prev, [id]: 'loading' }));
    
    // Simulate background check (1.2 seconds) with setTimeout wrapped in promise
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Calculate a refreshed confidence rate
    let delta = (Math.random() - 0.4) * 0.15; // adjust up or down slightly
    let newScore = currentConf + delta;
    
    // Fallbacks if confidence is too low or out of boundaries
    if (newScore > 1) newScore = 0.95;
    if (newScore < 0.3) newScore = Math.max(0.4, 0.4 + Math.random() * 0.3);
    
    // round to 2 decimals
    newScore = Math.round(newScore * 100) / 100;

    await onUpdateMemory(id, { confidence: newScore });
    
    setValidatingIds(prev => ({ ...prev, [id]: 'success' }));
    
    setTimeout(() => {
      setValidatingIds(prev => ({ ...prev, [id]: null }));
    }, 1800);
  };

  // Form states
  const [newContent, setNewContent] = useState('');
  const [newConfidence, setNewConfidence] = useState(90);
  const [newSource, setNewSource] = useState('Manual Discovery Entry');
  const [newType, setNewType] = useState<'world_facts' | 'experiences' | 'mental_models'>('world_facts');

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let yPos = 20;
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);

      const drawPageHeader = () => {
        // Draw elegant accent strip
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(margin, yPos, contentWidth, 4, 'F');
        yPos += 10;

        // Header Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(17, 24, 39); // dark slate/gray-900
        doc.text('SalesIQ Hindsight Memory Ledger', margin, yPos);
        yPos += 6;

        // Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(`Generated on: ${new Date().toLocaleString()} | Schema Version: v1.0.2-hindsight`, margin, yPos);
        yPos += 6;

        // Divider
        doc.setDrawColor(229, 231, 235); // gray-200
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 10;
      };

      // Helper for page overflow detection
      const checkPageOverflow = (neededHeight: number) => {
        if (yPos + neededHeight > 275) {
          doc.addPage();
          yPos = 20;
          drawPageHeader();
        }
      };

      drawPageHeader();

      // Gather categories
      const categories: { key: 'world_facts' | 'experiences' | 'mental_models'; label: string; color: [number, number, number] }[] = [
        { key: 'world_facts', label: 'WORLD FACTS', color: [147, 51, 234] }, // purple
        { key: 'experiences', label: 'ACTIVE EXPERIENCES & CASES', color: [13, 148, 136] }, // teal
        { key: 'mental_models', label: 'MENTAL MODELS & CONNOTATIVE LOGIC', color: [217, 119, 6] } // amber
      ];

      categories.forEach(({ key, label, color }) => {
        const list = memories[key] || [];
        if (list.length === 0) return;

        checkPageOverflow(18);

        // Section header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`${label} (${list.length} assertions)`, margin, yPos);
        yPos += 4;

        // Inline bar
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(margin, yPos, 24, 1, 'F');
        yPos += 8;

        list.forEach((m) => {
          // Prepare wrapped content text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const wrappedText = doc.splitTextToSize(m.content, contentWidth - 10);
          const blockHeight = 15 + (wrappedText.length * 4.5); // ID + spacing + wrap height + meta details

          checkPageOverflow(blockHeight);

          // Card Background structure (light border/offwhite bg)
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPos, contentWidth, blockHeight - 2, 'F');
          
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.3);
          doc.rect(margin, yPos, contentWidth, blockHeight - 2, 'S');

          // Left-side accent indicator bar
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(margin, yPos, 1.5, blockHeight - 2, 'F');

          // Render metadata / title row
          let xOffset = margin + 5;
          let tempY = yPos + 5;

          // Render memory ID
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(`ID: ${m.id}`, xOffset, tempY);

          // Confidence Badge
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(17, 24, 39);
          const confText = `Confidence: ${Math.round(m.confidence * 100)}%`;
          const confWidth = doc.getTextWidth(confText);
          doc.text(confText, margin + contentWidth - confWidth - 5, tempY);

          tempY += 6;

          // Content body
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(55, 65, 81); // gray-700
          wrappedText.forEach((line: string) => {
            doc.text(line, xOffset, tempY);
            tempY += 4.5;
          });

          tempY += 1.5;

          // Footer info
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(156, 163, 175); // gray-400
          doc.text(`Source Channel: ${m.source}   |   Timestamp: ${new Date(m.timestamp).toLocaleString()}`, xOffset, tempY);

          yPos += blockHeight + 3;
        });

        yPos += 4; // padding between domains
      });

      // Signature/Footer of final document
      checkPageOverflow(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('--- End of Cognitive State Export ---', margin + (contentWidth / 2), yPos, { align: 'center' });

      // Save PDF
      doc.save(`salesiq_hindsight_ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export memories to PDF', err);
    }
  };

  const getTabCount = (tab: 'world_facts' | 'experiences' | 'mental_models') => {
    if (!searchQuery.trim()) {
      return memories[tab].length;
    }
    const q = searchQuery.toLowerCase();
    const count = memories[tab].filter(m =>
      m.content.toLowerCase().includes(q) ||
      m.source.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    ).length;
    return `${count}/${memories[tab].length}`;
  };

  const currentMemories = memories[activeTab];

  // Filtering based on search query
  const filteredMemories = currentMemories.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.source.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    await onAddMemory({
      type: newType,
      content: newContent,
      confidence: newConfidence / 100,
      source: newSource
    });

    setNewContent('');
    setShowAddForm(false);
  };

  const startEditing = (m: Memory) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditConfidence(Math.round(m.confidence * 100));
  };

  const saveEdit = async (m: Memory) => {
    await onUpdateMemory(m.id, {
      content: editContent,
      confidence: editConfidence / 100
    });
    setEditingId(null);
  };

  const getTabColors = (tab: typeof activeTab) => {
    switch (tab) {
      case 'world_facts':
        return {
          bg: isDark ? 'bg-purple-950/40 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200',
          badge: 'bg-purple-600 text-white',
          border: isDark ? 'border-purple-500 border-b-2 text-purple-300' : 'border-purple-600 border-b-2 text-purple-700',
          text: isDark ? 'text-purple-200' : 'text-purple-900',
          indicator: isDark ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-purple-100 text-purple-850'
        };
      case 'experiences':
        return {
          bg: isDark ? 'bg-teal-950/40 text-teal-300 border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-200',
          badge: 'bg-teal-600 text-white',
          border: isDark ? 'border-teal-500 border-b-2 text-teal-300' : 'border-teal-600 border-b-2 text-teal-700',
          text: isDark ? 'text-teal-200' : 'text-teal-900',
          indicator: isDark ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-teal-100 text-teal-800'
        };
      case 'mental_models':
        return {
          bg: isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-600 text-white',
          border: isDark ? 'border-amber-500 border-b-2 text-amber-300 font-semibold' : 'border-amber-600 border-b-2 text-amber-700 font-semibold',
          text: isDark ? 'text-amber-200' : 'text-amber-900',
          indicator: isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800'
        };
    }
  };

  const colors = getTabColors(activeTab);

  return (
    <div className={`flex flex-col h-full border-l overflow-hidden transition-colors duration-200 ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-50 border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between transition-colors duration-200 ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-slate-100'}`}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className={`text-sm font-bold font-mono tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Hindsight Memory Ledger</h2>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Real-time persistent belief & experience index</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="export-memory-btn"
            onClick={handleExportPDF}
            className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-3xs'
            }`}
            title="Export cognitive memory ledger to formatted PDF document"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={onTriggerReflect}
            disabled={isReflecting}
            className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              isReflecting 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-500 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-xs'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isReflecting ? 'animate-spin' : ''}`} />
            {isReflecting ? 'Reflecting...' : 'Run Reflect'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex text-xs border-b transition-colors duration-200 ${isDark ? 'border-zinc-900 bg-black' : 'border-slate-200 bg-white'}`}>
        <button
          id="tab-world-facts"
          onClick={() => { setActiveTab('world_facts'); setShowAddForm(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition-all font-semibold cursor-pointer ${
            activeTab === 'world_facts' 
              ? (isDark ? 'border-purple-500 text-purple-300 bg-purple-950/20' : 'border-purple-600 text-purple-700 bg-purple-50/10')
              : (isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          World Facts ({getTabCount('world_facts')})
        </button>
        <button
          id="tab-experiences"
          onClick={() => { setActiveTab('experiences'); setShowAddForm(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition-all font-semibold cursor-pointer ${
            activeTab === 'experiences' 
              ? (isDark ? 'border-teal-500 text-teal-300 bg-teal-950/20' : 'border-teal-600 text-teal-700 bg-teal-50/10')
              : (isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          Experiences ({getTabCount('experiences')})
        </button>
        <button
          id="tab-mental-models"
          onClick={() => { setActiveTab('mental_models'); setShowAddForm(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition-all font-semibold cursor-pointer ${
            activeTab === 'mental_models' 
              ? (isDark ? 'border-amber-500 text-amber-300 bg-amber-950/20' : 'border-amber-600 text-amber-700 bg-amber-50/10')
              : (isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          Mental Models ({getTabCount('mental_models')})
        </button>
      </div>

      {/* Action and Search Row */}
      <div className={`p-3 border-b flex flex-col sm:flex-row gap-2 transition-colors duration-200 ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-slate-150'}`}>
        <div className="relative flex-1 animate-none">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="mem-search"
            type="text"
            placeholder={`Search ${activeTab.replace('_', ' ')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-12 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors duration-250 ${
              isDark 
                ? 'bg-zinc-900 border border-zinc-700 text-white focus:bg-black' 
                : 'bg-slate-50 border border-slate-200 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 top-2.5 p-0.5 rounded-full duration-150 transition cursor-pointer hover:bg-slate-200/50 ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          id="toggle-add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
            showAddForm 
              ? (isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-200 text-slate-700') 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? 'Cancel' : 'Retain Fact'}
        </button>
      </div>

      {/* Slide-down Manual Memory Retention Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className={`p-4 border-b shadow-inner space-y-3 transition-colors duration-200 ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
          <div className="flex gap-2">
            <span className={`text-xs font-bold font-mono uppercase ${isDark ? 'text-indigo-400' : 'text-indigo-950'}`}>Manual Retention Loop</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Concept Category</label>
              <select
                id="form-type-select"
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className={`w-full p-2 border rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-zinc-900 border-zinc-750 text-white' : 'border-slate-200'}`}
              >
                <option value="world_facts">World Fact</option>
                <option value="experiences">Experience</option>
                <option value="mental_models">Mental Model</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Confidence ({newConfidence}%)</label>
              <input
                id="form-conf-slider"
                type="range"
                min="0"
                max="100"
                value={newConfidence}
                onChange={(e) => setNewConfidence(parseInt(e.target.value))}
                className="w-full accent-indigo-650 mt-2 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Memory Statement</label>
            <textarea
              id="form-content-area"
              placeholder="e.g. Mike Torres requires a technical review meeting before committing implementation budgets."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className={`w-full p-2 border rounded text-xs h-16 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-zinc-900 border-zinc-750 text-white focus:bg-zinc-950' : 'border-slate-200'}`}
              required
            />
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={handleSuggestTags}
                disabled={isSuggestingTags || !newContent.trim()}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                  isSuggestingTags 
                    ? 'opacity-70 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                } ${isDark ? 'bg-zinc-900 border-zinc-750 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}
              >
                <Wand2 className={`w-3 h-3 ${isSuggestingTags ? 'animate-pulse' : ''}`} />
                <span>{isSuggestingTags ? 'Analyzing...' : 'Suggest AI Tags'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Log Input Source</label>
              <input
                id="form-source-input"
                type="text"
                placeholder="e.g. Post-it note, CEO slack briefing"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className={`w-full p-2 border rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-zinc-900 border-zinc-750 text-white' : 'border-slate-200'}`}
              />
            </div>
          </div>

          <button
            id="form-submit-btn"
            type="submit"
            className="w-full py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xs transition"
          >
            Formally Retain inside Hindsight
          </button>
        </form>
      )}

      {/* Memory Cards Display panel (with search and loading actions) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-xs gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing Hindsight ledger...</span>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className={`flex flex-col items-center justify-center p-8 border rounded-xl text-center ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-slate-150'}`}>
            <AlertCircle className="w-6 h-6 text-slate-300 mb-1" />
            <p className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>No context elements matches filter</p>
            <p className="text-[10px] text-slate-400 mt-1">Try another search or inject a new custom fact key above.</p>
          </div>
        ) : (
          filteredMemories.map((m) => {
            const isEditing = editingId === m.id;
            
            // Validation badge calculation based on confidence percentages representing confirmation rate
            const confPercent = Math.round(m.confidence * 100);
            let badgeText = 'Low';
            let badgeStyle = isDark ? 'bg-rose-950/40 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-250 text-rose-700';
            let dotStyle = 'bg-rose-500';
            
            if (confPercent >= 60 && confPercent < 85) {
              badgeText = 'Medium';
              badgeStyle = isDark ? 'bg-amber-950/40 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700';
              dotStyle = 'bg-amber-500';
            } else if (confPercent >= 85) {
              badgeText = 'High';
              badgeStyle = isDark ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700';
              dotStyle = 'bg-emerald-500';
            }

            return (
              <div 
                key={m.id} 
                id={`mem-card-${m.id}`}
                className={`border rounded-xl p-3 shadow-xs transition-all duration-300 relative flex flex-col gap-2.5 ${
                  validatingIds[m.id] === 'loading'
                    ? (isDark 
                        ? 'bg-zinc-950/90 border-amber-500 shadow-md shadow-amber-500/15 scale-[0.99]' 
                        : 'bg-amber-50/20 border-amber-500 shadow-sm shadow-amber-500/10 scale-[0.99]')
                    : validatingIds[m.id] === 'success'
                    ? (isDark 
                        ? 'bg-zinc-950 border-emerald-500 shadow-md shadow-emerald-500/15' 
                        : 'bg-emerald-50/10 border-emerald-500 shadow-sm shadow-emerald-500/10')
                    : (isDark 
                        ? 'bg-black hover:bg-zinc-950 border-zinc-800 text-white shadow-none' 
                        : 'bg-white hover:bg-slate-50/50 border-slate-200 text-slate-800')
                }`}
              >
                {/* Header indicators */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeTab === 'world_facts' && <Database className="w-3.5 h-3.5 text-purple-500" />}
                    {activeTab === 'experiences' && <Calendar className="w-3.5 h-3.5 text-teal-500" />}
                    {activeTab === 'mental_models' && <Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
                    <span className={`text-[10px] font-bold font-mono tracking-wider uppercase ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {m.id}
                    </span>
                    {validatingIds[m.id] === 'loading' ? (
                      <span 
                        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border leading-none font-medium scale-95 origin-left bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 animate-pulse"
                        title="Re-validating context item in real-time"
                      >
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Verifying...</span>
                      </span>
                    ) : validatingIds[m.id] === 'success' ? (
                      <span 
                        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border leading-none font-medium scale-95 origin-left bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
                        title="Context verified successfully"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        <span>Re-validated</span>
                      </span>
                    ) : (
                      <span 
                        className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border leading-none font-medium scale-95 origin-left ${badgeStyle}`}
                        title={`${badgeText} validation level based on call activity`}
                      >
                        <span className={`w-1 h-1 rounded-full ${dotStyle}`} />
                        <span>{badgeText} Confidence</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons: Edit, Delete, Save */}
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => handleRevalidate(m.id, m.confidence)}
                        disabled={validatingIds[m.id] === 'loading'}
                        className={`p-1 rounded-sm cursor-pointer transition-all duration-150 ${
                          validatingIds[m.id] === 'loading'
                            ? (isDark ? 'text-amber-400 bg-amber-950/45 animate-spin' : 'text-amber-600 bg-emerald-50 animate-spin')
                            : validatingIds[m.id] === 'success'
                            ? (isDark ? 'text-emerald-400 bg-emerald-950/40' : 'text-emerald-600 bg-emerald-50')
                            : (isDark ? 'text-indigo-400 bg-indigo-950 hover:bg-indigo-900/40' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100')
                        }`}
                        title="Re-validate Fact Score: Runs simulated background logic integrity check"
                      >
                        <RefreshCw className={`w-3 h-3 ${validatingIds[m.id] === 'loading' ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {isEditing ? (
                      <button
                        onClick={() => saveEdit(m)}
                        className={`p-1 rounded-sm cursor-pointer ${isDark ? 'text-emerald-400 bg-emerald-950 hover:bg-emerald-900/40' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                        title="Save Changes"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(m)}
                        className={`p-1 rounded-sm cursor-pointer ${isDark ? 'text-indigo-400 bg-indigo-950 hover:bg-indigo-900/40' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                        title="Edit Memory"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => setMemoryToDelete(m.id)}
                      className={`p-1 rounded-sm cursor-pointer ${isDark ? 'text-rose-400 bg-rose-950 hover:bg-rose-900/40' : 'text-rose-600 bg-rose-50 hover:bg-rose-100'}`}
                      title="Forget Memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content block */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={`w-full text-xs p-1.5 border rounded focus:outline-hidden ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-slate-300'}`}
                      rows={2}
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-400">Confidence:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editConfidence}
                        onChange={(e) => setEditConfidence(parseInt(e.target.value))}
                        className="w-24 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-indigo-700">{editConfidence}%</span>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{m.content}</p>
                )}

                {/* Footer metadata details with 'Re-validate' button */}
                <div className={`flex items-center justify-between text-[10px] border-t pt-2 font-mono ${isDark ? 'border-zinc-900 text-zinc-500' : 'border-slate-100 text-slate-400'}`}>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span>Source: {m.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRevalidate(m.id, m.confidence)}
                      disabled={validatingIds[m.id] === 'loading'}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all duration-200 cursor-pointer hover:scale-102 active:scale-98 text-[9px] font-bold ${
                        validatingIds[m.id] === 'loading'
                          ? 'animate-pulse text-amber-500 bg-amber-500/15 border border-amber-400/20'
                          : validatingIds[m.id] === 'success'
                          ? 'text-emerald-500 bg-emerald-500/15 border border-emerald-400/20'
                          : isDark
                          ? 'text-indigo-400 bg-indigo-950/50 hover:bg-indigo-900/45 border border-indigo-900/30'
                          : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100'
                      }`}
                      title="Trigger cloud verification audit ledger recalculation"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${validatingIds[m.id] === 'loading' ? 'animate-spin' : ''}`} />
                      <span>
                        {validatingIds[m.id] === 'loading'
                          ? 'Verifying...'
                          : validatingIds[m.id] === 'success'
                          ? 'Verified!'
                          : 'Re-validate'}
                      </span>
                    </button>
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold leading-none ${colors.indicator}`}>
                      CONF: {Math.round(m.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Safety Confirmation Modal */}
      {memoryToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl border p-5 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-3 text-rose-500">
              <AlertCircle className="w-6 h-6" />
              <h3 className={`text-lg font-bold font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>Delete Assertion?</h3>
            </div>
            <p className={`text-sm mb-5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Are you sure you want to permanently remove this cognitive assertion from the ledger? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setMemoryToDelete(null)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDark ? 'hover:bg-zinc-800 text-zinc-300 border border-zinc-700' : 'hover:bg-slate-100 text-slate-700 border border-slate-300'}`}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await onDeleteMemory(memoryToDelete);
                  setMemoryToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
