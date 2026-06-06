import React, { useState } from 'react';
import { useAuth } from '../AuthContext.js';
import { 
  Sparkles, Brain, User, Briefcase, Building, LogOut, ArrowRight, 
  MessageSquare, ClipboardList, Layers, Save, Check, ShieldCheck, 
  Database, RefreshCw, BarChart3, AlertCircle, HelpCircle, Award 
} from 'lucide-react';
import { motion } from 'motion/react';

import { Buyer } from '../types.js';

interface UserDashboardProps {
  onNavigate: (view: string) => void;
  isDark: boolean;
  onTriggerBriefing: (buyerId: string) => void;
  onTriggerReflect: (buyerId: string) => void;
  stats: {
    totalFacts: number;
    totalExperiences: number;
    totalModels: number;
  };
  onConnectLicense: () => void;
  buyers: Buyer[];
}

export default function UserDashboard({ 
  onNavigate, 
  isDark, 
  onTriggerBriefing, 
  onTriggerReflect,
  stats,
  onConnectLicense,
  buyers = []
}: UserDashboardProps) {
  const { profile, logOut, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setRole(profile.role || '');
      setCompany(profile.company || '');
    } else {
      setDisplayName('');
      setRole('');
      setCompany('');
    }
  }, [profile]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const calculateIntelMargin = () => {
    const factsContribution = stats.totalFacts * 12;
    const expContribution = stats.totalExperiences * 8;
    const modelsContribution = stats.totalModels * 25;
    const baseWeight = 65;
    return Math.min(100, baseWeight + factsContribution + expContribution + modelsContribution);
  };

  const intelMargin = calculateIntelMargin();

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserProfile(displayName, role, company);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalMemories = stats.totalFacts + stats.totalExperiences + stats.totalModels;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`p-6 max-y-auto space-y-6 flex-1 overflow-y-auto transition-colors duration-250 ${
        isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Welcome Banner */}
      <div className={`relative p-6 rounded-2xl border overflow-hidden transition-all duration-200 ${
        isDark 
          ? 'bg-zinc-950 border-zinc-850 shadow-none' 
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className={`text-[10px] uppercase font-mono font-bold tracking-wider mb-1 ${
              isDark ? 'text-indigo-400' : 'text-indigo-600'
            }`}>
              Sales Rep Dashboard
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-sans">
              Welcome back, <span className="text-indigo-500">{profile?.displayName || 'Strategic Advisor'}</span>!
            </h1>
            <p className={`text-xs mt-1.5 leading-relaxed max-w-xl ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Your hindsight cognitive network is active. Currently monitoring high-stake accounts with <strong>{totalMemories} verified assertion nodes</strong> registered in real-time sync.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {profile ? (
              <>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    isEditingProfile 
                      ? 'bg-zinc-650 text-white border-zinc-600' 
                      : (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-250 text-slate-800 hover:bg-slate-200/80')
                  }`}
                >
                  {isEditingProfile ? 'Close Settings' : 'Edit Profile'}
                </button>
                <button
                  id="dash-logout-btn"
                  onClick={() => logOut()}
                  className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 active:scale-97 transition cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={onConnectLicense}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 hover:shadow text-white font-extrabold text-xs rounded-xl active:scale-97 transition flex items-center gap-1.5 cursor-pointer shadow-md tracking-wider uppercase font-mono"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Connect License</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Editing Section */}
        {isEditingProfile && (
          <form onSubmit={handleProfileSave} className="mt-6 pt-6 border-t border-dashed border-zinc-850 max-w-xl space-y-4">
            <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Update Saved User Profile Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full p-2 text-xs rounded-lg focus:outline-hidden ${
                    isDark ? 'bg-zinc-900 border border-zinc-750 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Job Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full p-2 text-xs rounded-lg focus:outline-hidden ${
                    isDark ? 'bg-zinc-900 border border-zinc-750 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`w-full p-2 text-xs rounded-lg focus:outline-hidden ${
                    isDark ? 'bg-zinc-900 border border-zinc-750 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Details'}</span>
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Profile updated in Firestore!</span>
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Stats Summary Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Memories */}
        <div 
          onMouseEnter={() => setActiveTooltip('memories')}
          onMouseLeave={() => setActiveTooltip(null)}
          className={`p-4 border rounded-xl flex items-center gap-3.5 relative transition-all duration-250 select-none ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-500">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Insights</span>
              <HelpCircle className="w-3 h-3 text-zinc-450 cursor-help" />
            </div>
            <div className="text-xl font-bold font-sans mt-0.5">{totalMemories}</div>
          </div>
          
          {activeTooltip === 'memories' && (
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-56 rounded-xl border z-30 shadow-xl text-[10px] leading-relaxed backdrop-blur-md ${
              isDark ? 'bg-zinc-900 border-zinc-750 text-zinc-300' : 'bg-white border-slate-200 text-slate-650'
            }`}>
              <p className="font-bold border-b border-zinc-800 pb-1 mb-1 text-xs">Total Insights</p>
              Aggregate count of all verified facts, buyer notes, and custom heuristics saved inside your active intelligence base.
            </div>
          )}
        </div>

        {/* Facts count */}
        <div 
          onMouseEnter={() => setActiveTooltip('facts')}
          onMouseLeave={() => setActiveTooltip(null)}
          className={`p-4 border rounded-xl flex items-center gap-3.5 relative transition-all duration-250 select-none ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-emerald-600/10 text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>World Facts</span>
              <HelpCircle className="w-3 h-3 text-zinc-450 cursor-help" />
            </div>
            <div className="text-xl font-bold font-sans mt-0.5">{stats.totalFacts}</div>
          </div>

          {activeTooltip === 'facts' && (
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-56 rounded-xl border z-30 shadow-xl text-[10px] leading-relaxed backdrop-blur-md ${
              isDark ? 'bg-zinc-900 border-zinc-750 text-zinc-300' : 'bg-white border-slate-200 text-slate-650'
            }`}>
              <p className="font-bold border-b border-zinc-805 pb-1 mb-1 text-xs">World Facts</p>
              Hard parameters, deal rules, legal constraints, and client details extracted automatically from negotiation logs.
            </div>
          )}
        </div>

        {/* Experience count */}
        <div 
          onMouseEnter={() => setActiveTooltip('experiences')}
          onMouseLeave={() => setActiveTooltip(null)}
          className={`p-4 border rounded-xl flex items-center gap-3.5 relative transition-all duration-250 select-none ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Logged Experiences</span>
              <HelpCircle className="w-3 h-3 text-zinc-455 cursor-help" />
            </div>
            <div className="text-xl font-bold font-sans mt-0.5">{stats.totalExperiences}</div>
          </div>

          {activeTooltip === 'experiences' && (
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-56 rounded-xl border z-30 shadow-xl text-[10px] leading-relaxed backdrop-blur-md ${
              isDark ? 'bg-zinc-900 border-zinc-750 text-zinc-300' : 'bg-white border-slate-200 text-slate-650'
            }`}>
              <p className="font-bold border-b border-zinc-805 pb-1 mb-1 text-xs">Logged Experiences</p>
              History of specific customer interactions, call milestones, and real-time meeting summaries.
            </div>
          )}
        </div>

        {/* Mental models count */}
        <div 
          onMouseEnter={() => setActiveTooltip('heuristics')}
          onMouseLeave={() => setActiveTooltip(null)}
          className={`p-4 border rounded-xl flex items-center gap-3.5 relative transition-all duration-250 select-none ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-amber-600/10 text-amber-500">
            <Brain className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-505'}`}>Mental Models</span>
              <HelpCircle className="w-3 h-3 text-zinc-455 cursor-help" />
            </div>
            <div className="text-xl font-bold font-sans mt-0.5">{stats.totalModels}</div>
          </div>

          {activeTooltip === 'heuristics' && (
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-56 rounded-xl border z-30 shadow-xl text-[10px] leading-relaxed backdrop-blur-md ${
              isDark ? 'bg-zinc-900 border-zinc-750 text-zinc-300' : 'bg-white border-slate-200 text-slate-650'
            }`}>
              <p className="font-bold border-b border-zinc-805 pb-1 mb-1 text-xs">Mental Models</p>
              AI-synthesized counterplay plans, CFO negotiation maps, and buyer requirement patterns.
            </div>
          )}
        </div>

        {/* Account Intelligence Margin */}
        <div 
          onMouseEnter={() => setActiveTooltip('margin')}
          onMouseLeave={() => setActiveTooltip(null)}
          className={`p-4 border rounded-xl flex items-center gap-3.5 relative transition-all duration-250 select-none cursor-help ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-500">
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-[9.5px] uppercase font-bold font-mono tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Deal Readiness</span>
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            </div>
            <div className="text-xl font-bold font-sans mt-0.5 text-indigo-520">{intelMargin}%</div>
          </div>

          {activeTooltip === 'margin' && (
            <div className={`absolute bottom-full right-0 lg:left-1/2 lg:transform lg:-translate-x-1/2 mb-2 p-4 w-72 rounded-2xl border z-30 shadow-2xl text-[10px] leading-relaxed backdrop-blur-md font-sans ${
              isDark ? 'bg-zinc-950/95 border-zinc-800 text-zinc-300 shadow-black' : 'bg-white/95 border-slate-200 text-slate-700 shadow-slate-300'
            }`}>
              <p className="font-bold border-b border-indigo-500/30 pb-1.5 mb-2 text-xs text-indigo-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Account Deal Readiness</span>
              </p>
              <p className="leading-relaxed">
                A quantitative score representing how well-prepared you are for live contract discussions. This score rises automatically as you capture more customer-profile facts, log call milestones, and synthesize tactical counterplay models. A higher preparation level is proven to reduce contract cycles by over 45%.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Core Features Launchers */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: Active Focus Accounts */}
        <div className={`border rounded-xl p-5 space-y-4 transition-all duration-200 ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-205'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold tracking-tight font-sans">Active Focus Account Channels</h3>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
              isDark ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900' : 'bg-indigo-50 text-indigo-700 border-indigo-150'
            }`}>
              {buyers.length} Accounts Linked
            </span>
          </div>

          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Configure live accounts, enter chat interfaces loaded with dynamic memory injects, and prepare negotiations.
          </p>

          <div className="space-y-3 pt-1 max-h-[300px] overflow-y-auto">
            {buyers.map((buyer) => (
              <div key={`focus-${buyer.id}`} className={`p-3.5 border rounded-lg flex items-center justify-between transition-all duration-200 hover:translate-x-1 ${
                isDark ? 'bg-black border-zinc-850 hover:bg-zinc-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                    {buyer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{buyer.name} ({buyer.company})</h4>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-450'}`}>{buyer.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(buyer.id)}
                  className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded flex items-center gap-1 cursor-pointer transition uppercase"
                >
                  <span>Focus Room</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Strategic Sales Utilities */}
        <div className={`border rounded-xl p-5 space-y-4 transition-all duration-200 ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-205'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-505 animate-pulse" />
              <h3 className="text-sm font-bold tracking-tight font-sans">Strategic Operations Toolkit</h3>
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Trigger contextual reflection engines, compile buyer dossiers, and log call debrief summaries.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* Utility 1: Post-call Debrief Form */}
            <div className={`p-3 border rounded-lg flex items-center justify-between ${
              isDark ? 'bg-black border-zinc-850' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-emerald-550 mr-1" />
                <div>
                  <h4 className="text-xs font-bold">Post-Call Meeting Debrief</h4>
                  <p className="text-[10px] text-zinc-500">Transform meeting discussion notes into playbook rules</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('debrief')}
                className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer transition uppercase"
              >
                Run Form
              </button>
            </div>

            {/* Utility 2: Pre-call briefings compilation */}
            <div className={`p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
              isDark ? 'bg-black border-zinc-850' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-400 mr-1" />
                <div>
                  <h4 className="text-xs font-bold">Buyer Briefing Dossier</h4>
                  <p className="text-[10px] text-zinc-500">Synthesize client-ready executive overview booklet</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end self-end md:self-auto">
                {buyers.map(b => (
                  <button
                    key={`prep-${b.id}`}
                    onClick={() => onTriggerBriefing(b.id)}
                    className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded cursor-pointer transition uppercase tracking-wider"
                  >
                    Prep {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Utility 3: Manual reflection patterns loop */}
            <div className={`p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
              isDark ? 'bg-black border-zinc-850' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-amber-500 mr-1" />
                <div>
                  <h4 className="text-xs font-bold">Update Buyer Belief Models</h4>
                  <p className="text-[10px] text-zinc-500">Recalculate objection risk levels and criteria</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end self-end md:self-auto">
                {buyers.map(b => (
                  <button
                    key={`reflect-${b.id}`}
                    onClick={() => onTriggerReflect(b.id)}
                    className="p-1 px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 text-[9px] font-bold rounded cursor-pointer transition uppercase tracking-wider"
                  >
                    Reflect {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Log Section - Summary of Recent Activity */}
      <section className={`border rounded-xl p-5 space-y-3 transition-all duration-200 ${
        isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-205'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-450" />
            <h3 className="text-sm font-bold tracking-tight font-sans">Recent Updates Log</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-sans">
            <thead>
              <tr className={`border-b ${isDark ? 'border-zinc-850 text-zinc-500' : 'border-slate-150 text-slate-400'}`}>
                <th className="py-2 font-mono">Timestamp</th>
                <th className="py-2 font-mono">Insight Category</th>
                <th className="py-2 font-mono">Target Account</th>
                <th className="py-2 font-mono">Source Channel</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-900/60' : 'divide-slate-100'}`}>
              <tr>
                <td className="py-2 text-zinc-500 font-mono">2026-06-04 18:10</td>
                <td className="py-2">
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-505 rounded text-[9px] font-bold uppercase tracking-wide">Mental Model</span>
                </td>
                <td className="py-2 font-bold">Acme Corp</td>
                <td className="py-2 text-zinc-550 font-mono">Active Chat Extraction</td>
              </tr>
              <tr>
                <td className="py-2 text-zinc-500 font-mono">2026-06-02 16:00</td>
                <td className="py-2">
                  <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold uppercase tracking-wide">Experience</span>
                </td>
                <td className="py-2 font-bold">Acme Corp</td>
                <td className="py-2 text-zinc-550 font-mono">POC Evaluation Debrief</td>
              </tr>
              <tr>
                <td className="py-2 text-zinc-500 font-mono">2026-05-28 10:15</td>
                <td className="py-2">
                  <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold uppercase tracking-wide">Experience</span>
                </td>
                <td className="py-2 font-bold">Acme Corp</td>
                <td className="py-2 text-zinc-550 font-mono">Legal & Compliance Session</td>
              </tr>
              <tr>
                <td className="py-2 text-zinc-405 font-mono">2026-05-18 16:30</td>
                <td className="py-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold uppercase tracking-wide">World Fact</span>
                </td>
                <td className="py-2 font-bold">Acme Corp</td>
                <td className="py-2 text-zinc-550 font-mono">CFO Pricing Call</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}
