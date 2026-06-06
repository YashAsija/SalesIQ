import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Bot, Zap, Brain, MessageSquare, ClipboardList, 
  ChevronRight, Calendar, User, Globe, AlertTriangle, Play, HelpCircle, 
  Menu, Info, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, Layers,
  Sun, Moon, Mic, MicOff, Plus, UserPlus, X
} from 'lucide-react';

import { Memory, Buyer, Message, DebriefData } from './types.js';
import BeforeAfterResponse from './components/BeforeAfterResponse.tsx';
import MemoryInspector from './components/MemoryInspector.tsx';
import BriefingPanel from './components/BriefingPanel.tsx';
import DebriefForm from './components/DebriefForm.tsx';
import AddBuyerForm from './components/AddBuyerForm.tsx';
import { useAuth } from './AuthContext.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import UserDashboard from './components/UserDashboard.tsx';
import { motion } from 'motion/react';

export default function App() {
  const { user, profile, logOut, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [stats, setStats] = useState({ totalFacts: 0, totalExperiences: 0, totalModels: 0 });

  const [buyers, setBuyers] = useState<Buyer[]>([]);

  // Theme state - light vs high-contrast dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('salesiq-theme') as 'light' | 'dark') || 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('salesiq-theme', theme);
  }, [theme]);
  const [activeBuyerId, setActiveBuyerId] = useState<string>('sarah_chen_acme');
  const [memories, setMemories] = useState<{
    world_facts: Memory[];
    experiences: Memory[];
    mental_models: Memory[];
  }>({ world_facts: [], experiences: [], mental_models: [] });

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);

  // Panel Control states
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingMarkdown, setBriefingMarkdown] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global demo state
  const [demoMode, setDemoMode] = useState<'after' | 'before'>('after');
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeBuyer = buyers.find(b => b.id === activeBuyerId) || {
    id: 'sarah_chen_acme',
    name: 'Sarah Chen',
    company: 'Acme Corp',
    role: 'VP of Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
  };

  useEffect(() => {
    fetchBuyers();
    fetchDashboardStats();
  }, [user]);

  useEffect(() => {
    if (activeBuyerId) {
      fetchMemories();
      loadHistory();
    }
  }, [activeBuyerId, user]);

  useEffect(() => {
    if (user) {
      setIsAuthOpen(false);
      setCurrentView('dashboard');
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, chatLoading]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Web Speech API is not supported on this browser.", "info");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          showToast("Microphone access denied. Please allow microphone permissions.", "info");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
          showToast("Speech transcribed!", "success");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const resBuyers = await axios.get('/api/buyers');
      const allBuyers = resBuyers.data;
      
      let totalFacts = 0;
      let totalExperiences = 0;
      let totalModels = 0;

      await Promise.all(allBuyers.map(async (b: any) => {
        try {
          const res = await axios.get(`/api/memories/${b.id}`);
          totalFacts += (res.data.world_facts?.length || 0);
          totalExperiences += (res.data.experiences?.length || 0);
          totalModels += (res.data.mental_models?.length || 0);
        } catch(err) {
          // ignore
        }
      }));
      
      setStats({ totalFacts, totalExperiences, totalModels });
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    }
  };

  const fetchBuyers = async () => {
    try {
      const res = await axios.get('/api/buyers');
      setBuyers(res.data);
    } catch (e) {
      console.error("Failed to load buyers", e);
    }
  };

  const handleCreateBuyer = async (name: string, company: string, role: string) => {
    try {
      const res = await axios.post('/api/buyers', { name, company, role });
      const newBuyer = res.data;
      showToast(`Account focus created: ${newBuyer.name} @ ${newBuyer.company}!`, "success");
      await fetchBuyers();
      setActiveBuyerId(newBuyer.id);
      setCurrentView(newBuyer.id);
      await fetchDashboardStats();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const fetchMemories = async () => {
    setMemoriesLoading(true);
    try {
      const res = await axios.get(`/api/memories/${activeBuyerId}`);
      setMemories(res.data);
      fetchDashboardStats();
    } catch (e) {
      console.error("Failed to load memories", e);
    } finally {
      setMemoriesLoading(false);
    }
  };

  const loadHistory = async () => {
    // Standard histories
    try {
      // Fetch initial set
      const initialHistory: Message[] = [
        {
          role: 'system',
          content: 'You are SalesIQ, an AI sales intelligence agent. You have perfect memory of every interaction with this buyer. Always reference specific past interactions.'
        },
        {
          role: 'user',
          content: 'Remind me why Acme Corp might object to our initial deployment plans.'
        },
        {
          role: 'assistant',
          content: '',
          isBeforeAfter: true,
          beforeContent: 'I would love to help you prepare for your sales negotiation, but as a stateless model, I do not have access to any previous call notes, client details, specific budget objections, or competitor configurations for this deal. Please provide me with details about the buyer\'s organization, their budget limitations, legal flags, and what occurred on past calls so I can assist.',
          afterContent: 'Based on your direct interactions with Acme Corp:\n\n1. **Board Gating Threshold**: CFO Mike Torres explicitly objected to any proposal exceeding $100K/year without active board review (which takes 4+ weeks). He requested exploring a separated fee structure (e.g., $95K Software Base plus separate Services package) to circumvent this bottleneck.\n2. **European Data Sovereignty**: During legal review on May 28, their counsel flagged that user logs and deployment configuration files must remain strictly within European Union borders (Germany/Ireland) under GDPR scope. Doing so is critical; legal will veto the pipeline plan if European data confinement is not certified.'
        }
      ];
      setChatHistory(activeBuyerId === 'sarah_chen_acme' ? initialHistory : []);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Chat Submission Core handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to run Gemini real-time memories.", "info");
      return;
    }
    if (!inputMessage.trim() || chatLoading) return;

    const userMsgText = inputMessage;
    setInputMessage('');

    const userMessage: Message = {
      role: 'user',
      content: userMsgText,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatLoading(true);

    try {
      // Strip formatting structures out of past chats to keep context simple
      const cleanHistory = chatHistory.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.isBeforeAfter ? m.afterContent : m.content
      }));

      const res = await axios.post('/api/chat', {
        message: userMsgText,
        buyer_id: activeBuyerId,
        conversation_history: cleanHistory,
        mode: demoMode
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date().toISOString(),
        isBeforeAfter: true,
        beforeContent: res.data.beforeResponse,
        afterContent: res.data.afterResponse
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      
      // Dynamic Retain happened, sync Hindsight panel!
      fetchMemories();
    } catch (error) {
      console.error("Chat failure", error);
      showToast("Model output failed. Make sure your API key is correctly configured.", "info");
    } finally {
      setChatLoading(false);
    }
  };

  // Debrief Submit Loop
  const handleDebriefSubmit = async (data: DebriefData) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to process debrief factors.", "info");
      return;
    }
    try {
      const res = await axios.post('/api/debrief', data);
      showToast("Debrief parsed. Extracted new World Facts & Experiences!", "success");
      fetchMemories();
      fetchDashboardStats();
    } catch (e) {
      console.error(e);
      showToast("Failed to process debrief factors.", "info");
    }
  };

  // Compiles Briefing file from backend
  const handleGenerateBriefing = async () => {
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to compile briefing profiles.", "info");
      return;
    }
    setIsBriefingOpen(true);
    setBriefingLoading(true);
    try {
      const res = await axios.get(`/api/briefing/${activeBuyerId}`);
      setBriefingMarkdown(res.data.briefing);
    } catch (e) {
      console.error(e);
      showToast("Briefing pipeline compilation failed.", "info");
    } finally {
      setBriefingLoading(false);
    }
  };

  // Manual synthesis loop
  const handleTriggerReflect = async () => {
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to run Hindsight reflection.", "info");
      return;
    }
    setIsReflecting(true);
    showToast("Running manual Hindsight Reflect() thread on past experiences...", "info");
    try {
      await axios.post(`/api/reflect/${activeBuyerId}`);
      showToast("Reflection loop finished: Evolved beliefs & Mental Models updated!", "success");
      fetchMemories();
    } catch (e) {
      console.error(e);
      showToast("Reflection loop failed.", "info");
    } finally {
      setIsReflecting(false);
    }
  };

  // Inner memory actions (Inserts, PUT updates, DELETE)
  const handleAddMemory = async (memoryPayload: Partial<Memory>) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to modify knowledge base.", "info");
      return;
    }
    try {
      await axios.post(`/api/memories/${activeBuyerId}`, memoryPayload);
      showToast("Injected custom fact into Hindsight database", "success");
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMemory = async (id: string, updatedPayload: Partial<Memory>) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to modify knowledge base.", "info");
      return;
    }
    try {
      await axios.put(`/api/memories/${activeBuyerId}/${id}`, updatedPayload);
      showToast("Memory entry updated live", "success");
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast("License Authentication Required to modify knowledge base.", "info");
      return;
    }
    try {
      await axios.delete(`/api/memories/${activeBuyerId}/${id}`);
      showToast("Memory deleted (Forgetting factor active)", "success");
      fetchMemories();
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-250 ${
        isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-805'
      }`}>
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-xs font-mono font-bold tracking-widest uppercase">Connecting to SalesIQ Hindsight Cluster...</p>
      </div>
    );
  }



  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden antialiased transition-colors duration-200 ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Toast Notification */}
      {notification && (
        <div id="toast-notif" className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-2 border ${
            notification.type === 'success' 
              ? (isDark ? 'bg-zinc-950 text-emerald-400 border-zinc-805 shadow-none' : 'bg-slate-900 text-emerald-400 border-slate-800') 
              : (isDark ? 'bg-zinc-950 text-indigo-400 border-zinc-805 shadow-none' : 'bg-slate-900 text-indigo-400 border-slate-800')
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`hidden md:flex w-56 flex-col select-none shrink-0 border-r transition-colors duration-200 ${
        isDark ? 'bg-black border-zinc-850' : 'bg-slate-900 border-slate-850'
      }`}>
        <div className={`p-4 flex items-center gap-2 border-b ${isDark ? 'border-zinc-850' : 'border-slate-850'}`}>
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs font-mono">IQ</div>
          <span className="font-semibold text-slate-100 tracking-tight text-xs font-mono">SalesIQ Hub v1.0</span>
        </div>
        
        <nav className="flex-1 p-2 space-y-0.5">
          <div className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Control Center</div>
          
          <button
            id="tab-dashboard"
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-left w-full transition-all text-xs font-medium cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dashboard Hub</span>
          </button>

          <div className="px-3 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
            <span>Accounts Focus</span>
            <button 
              onClick={() => setIsAddBuyerOpen(true)}
              className="p-1 rounded bg-indigo-650 hover:bg-indigo-600 text-white font-bold tracking-tight text-[9px] font-mono cursor-pointer flex items-center gap-0.5"
              title="Add a new target focus account"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>NEW</span>
            </button>
          </div>
          
          <div className="space-y-0.5 max-h-52 overflow-y-auto">
            {buyers.map((b) => (
              <button
                key={b.id}
                id={`tab-${b.id}`}
                onClick={() => {
                  setActiveBuyerId(b.id);
                  setCurrentView(b.id);
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-left w-full transition-all text-xs font-medium cursor-pointer ${
                  currentView === b.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate">{b.name} ({b.company})</span>
              </button>
            ))}
          </div>

          <div className="px-3 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Infrastructure</div>
          
          <button
            id="global-debrief-btn"
            onClick={() => {
              if (!user) {
                setIsAuthOpen(true);
                showToast("License Authentication Required to process debrief factors.", "info");
                return;
              }
              setIsDebriefOpen(true);
            }}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-left w-full text-slate-400 hover:text-slate-100 text-xs transition cursor-pointer font-medium animate-none ${
              isDark ? 'hover:bg-zinc-900' : 'hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
            <span>Post-Call Debrief</span>
          </button>

          <button
            id="pre-call-brief-btn"
            onClick={handleGenerateBriefing}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-left w-full text-slate-400 hover:text-slate-100 text-xs transition cursor-pointer font-medium ${
              isDark ? 'hover:bg-zinc-900' : 'hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pre-Call Briefing</span>
          </button>

          <button
            onClick={handleTriggerReflect}
            disabled={isReflecting}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-left w-full text-slate-400 hover:text-slate-105 text-xs transition cursor-pointer font-medium disabled:opacity-50 ${
              isDark ? 'hover:bg-zinc-900' : 'hover:bg-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Analyze Patterns</span>
          </button>
        </nav>

        <div className={`p-4 border-t bg-slate-950 ${isDark ? 'border-zinc-850/80' : 'border-slate-850'}`}>
          {user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-extrabold text-white text-xs font-mono shrink-0">
                  {profile?.displayName ? profile.displayName.substring(0, 2).toUpperCase() : 'SR'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate">{profile?.displayName || 'Sales Representative'}</p>
                  <p className="text-[9px] text-slate-500 font-mono truncate">{profile?.role || 'Sales IQ PRO'}</p>
                </div>
              </div>
              <button
                onClick={logOut}
                className="text-[9px] font-bold font-mono text-rose-500 hover:text-rose-300 cursor-pointer"
                title="Disconnect License"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-zinc-100 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider border border-indigo-500/30"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connect License</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Slide-over */}
      {isMobileNavOpen && (
        <div id="mobile-nav-drawer" className="fixed inset-0 z-50 overflow-hidden flex md:hidden bg-slate-900/60 backdrop-blur-xs">
          <div 
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`relative w-64 max-w-xs h-full flex flex-col border-r transition-colors duration-200 ${
              isDark ? 'bg-black border-zinc-850 text-white' : 'bg-slate-900 border-slate-850 text-slate-100'
            }`}
          >
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-zinc-850' : 'border-slate-850'}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs font-mono">IQ</div>
                <span className="font-semibold text-slate-100 tracking-tight text-xs font-mono">SalesIQ Hub</span>
              </div>
              <button 
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <span className="sr-only">Close menu</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 p-3 space-y-1">
              <div className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Control Center</div>
              
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setIsMobileNavOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-left w-full transition-all text-xs font-medium cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-150'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Dashboard Hub</span>
              </button>

              <div className="px-3 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
                <span>Accounts Focus</span>
                <button 
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setIsAddBuyerOpen(true);
                  }}
                  className="p-1 rounded bg-indigo-650 hover:bg-indigo-600 text-white font-bold tracking-tight text-[9px] font-mono cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>NEW</span>
                </button>
              </div>
              
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {buyers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBuyerId(b.id);
                      setCurrentView(b.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-left w-full transition-all text-xs font-medium cursor-pointer ${
                      currentView === b.id
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-150'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{b.name} ({b.company})</span>
                  </button>
                ))}
              </div>

              <div className="px-3 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Infrastructure</div>
              
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  if (!user) {
                    setIsAuthOpen(true);
                    showToast("License Authentication Required to process debrief factors.", "info");
                    return;
                  }
                  setIsDebriefOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-left w-full text-slate-400 hover:text-slate-100 text-xs transition cursor-pointer font-medium"
              >
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <span>Post-Call Debrief</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleGenerateBriefing();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-left w-full text-slate-400 hover:text-slate-100 text-xs transition cursor-pointer font-medium"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Pre-Call Briefing</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleTriggerReflect();
                }}
                disabled={isReflecting}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-left w-full text-slate-400 hover:text-slate-105 text-xs transition cursor-pointer font-medium disabled:opacity-50"
              >
                <Brain className="w-4 h-4 text-amber-400" />
                <span>Analyze Patterns</span>
              </button>
            </nav>

            <div className={`p-4 border-t bg-slate-950 ${isDark ? 'border-zinc-850/80' : 'border-slate-850'}`}>
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-extrabold text-white text-xs font-mono shrink-0">
                      {profile?.displayName ? profile.displayName.substring(0, 2).toUpperCase() : 'SR'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-slate-100 truncate">{profile?.displayName || 'Sales Rep'}</p>
                      <p className="text-[9px] text-slate-500 font-mono truncate">{profile?.role || 'Sales IQ PRO'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logOut();
                      setIsMobileNavOpen(false);
                    }}
                    className="text-[9px] font-bold font-mono text-rose-500 hover:text-rose-300 cursor-pointer"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-zinc-100 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer font-mono uppercase"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Connect License</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className={`h-14 border-b px-4 md:px-6 flex items-center justify-between shadow-xs shrink-0 select-none transition-colors duration-200 ${
          isDark ? 'bg-black border-zinc-900 text-white shadow-none' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className={`p-1.5 rounded md:hidden hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className={`text-xs md:text-sm font-bold tracking-tight uppercase font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {currentView === 'dashboard' ? 'Strategic Advisor Console' : 'Lead Intelligence Dashboard'}
            </h1>
            <div className="flex gap-1.5 font-mono">
              <span className={`px-2 py-0.5 border text-[10px] font-bold rounded uppercase tracking-tighter flex items-center gap-1 ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE STATUS
              </span>
              {currentView !== 'dashboard' && (
                <span className={`hidden sm:inline-block px-2 py-0.5 border text-[10px] font-bold rounded uppercase tracking-tighter ${
                  isDark ? 'bg-zinc-900 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {activeBuyer.company}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {currentView !== 'dashboard' && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className={`text-[10px] uppercase font-bold font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>View Filter:</span>
                <button
                  id="demo-mode-toggle"
                  onClick={() => {
                    const nextMode = demoMode === 'after' ? 'before' : 'after';
                    setDemoMode(nextMode);
                    showToast(`Evaluation mode changed to: Hindsight ${nextMode === 'after' ? 'ON' : 'OFF'}`, "info");
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider rounded border cursor-pointer transition-all uppercase ${
                    isDark 
                      ? 'border-indigo-900 bg-indigo-950/60 text-indigo-400 hover:bg-indigo-900' 
                      : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {demoMode === 'after' ? '🎯 Hindsight ON' : '👀 Hindsight OFF'}
                </button>
              </div>
            )}

            <button
              id="theme-toggle"
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : 'light';
                setTheme(nextTheme);
                showToast(`Theme switched to ${nextTheme === 'dark' ? 'High-Contrast Dark Mode' : 'Light Theme'}`, "success");
              }}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                isDark 
                  ? 'bg-zinc-950 text-amber-400 border-zinc-700 hover:bg-zinc-900' 
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title={isDark ? "Activate Light Mode" : "Activate High-Contrast Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button 
              className={`p-1.5 rounded transition-colors ${
                isDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-slate-505 hover:bg-slate-100'
              }`} 
              onClick={() => showToast("Telemetry sync cluster refreshed.", "success")}
              title="Refresh Clusters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CORE VIEWS NAVIGATION ROUTING */}
        {currentView === 'dashboard' ? (
          <UserDashboard
            onNavigate={(view) => {
              if (view === 'debrief') {
                if (!user) {
                  setIsAuthOpen(true);
                  showToast("License Authentication Required to process debrief factors.", "info");
                  return;
                }
                setIsDebriefOpen(true);
              } else {
                setCurrentView(view);
                setActiveBuyerId(view);
              }
            }}
            isDark={isDark}
            onTriggerBriefing={(buyerId) => {
              if (!user) {
                setIsAuthOpen(true);
                showToast("License Authentication Required to compile briefing profiles.", "info");
                return;
              }
              setActiveBuyerId(buyerId);
              setTimeout(() => {
                handleGenerateBriefing();
              }, 100);
            }}
            onTriggerReflect={(buyerId) => {
              if (!user) {
                setIsAuthOpen(true);
                showToast("License Authentication Required to run Hindsight reflection.", "info");
                return;
              }
              setActiveBuyerId(buyerId);
              setTimeout(() => {
                handleTriggerReflect();
              }, 105);
            }}
            stats={stats}
            onConnectLicense={() => setIsAuthOpen(true)}
            buyers={buyers}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Content KPI Row */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b shrink-0 transition-colors duration-205 ${
              isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`p-3 border rounded-lg shadow-2xs flex flex-col justify-between transition-colors duration-200 ${
                isDark ? 'bg-black border-zinc-805 text-white shadow-none' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className={`text-[9px] font-bold uppercase tracking-widest font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Knowledge Base Entries</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {memories.world_facts.length + memories.experiences.length + memories.mental_models.length}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>assertions retained</span>
                </div>
                <div className={`mt-1 text-[9px] font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>105% active ledger sync</div>
              </div>

              <div className={`p-3 border rounded-lg shadow-2xs flex flex-col justify-between transition-colors duration-200 ${
                isDark ? 'bg-black border-zinc-805 text-white shadow-none' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className={`text-[9px] font-bold uppercase tracking-widest font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Evolved Mental Models</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{memories.mental_models.length}</span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>beliefs evolved</span>
                </div>
                <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, memories.mental_models.length * 30 + 10)}%` }}></div>
                </div>
              </div>

              <div className={`p-3 border rounded-lg shadow-2xs flex flex-col justify-between transition-colors duration-200 ${
                isDark ? 'bg-black border-zinc-805 text-white shadow-none' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className={`text-[9px] font-bold uppercase tracking-widest mb-1 font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Account Intelligence Margin</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl font-bold font-mono ${isDark ? 'text-indigo-404' : 'text-indigo-755'}`}>OPTIMUM</span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>92.4% match</span>
                </div>
                <div className={`mt-1 text-[9px] font-semibold font-mono flex items-center gap-1 ${
                  isDark ? 'text-indigo-405' : 'text-indigo-500'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Timeline comparisons active
                </div>
              </div>
            </div>

            {/* Workspace core */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-200 ${
              isDark ? 'bg-zinc-950' : 'bg-slate-100'
            }`}>
              
              {/* PRIMARY COMPONENT: Full-Width Retrospective memory ledger list dashboard */}
              <main id="primary-memory-workspace" className="flex-1 h-full overflow-hidden flex flex-col">
                <MemoryInspector
                  memories={memories}
                  isLoading={memoriesLoading}
                  onAddMemory={handleAddMemory}
                  onUpdateMemory={handleUpdateMemory}
                  onDeleteMemory={handleDeleteMemory}
                  onTriggerReflect={handleTriggerReflect}
                  isReflecting={isReflecting}
                  isDark={isDark}
                />
              </main>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className={`h-8 border-t px-4 flex items-center justify-between text-[10px] select-none shrink-0 font-mono transition-colors duration-200 ${
          isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-500' : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          <div className="flex gap-4">
            <span>SalesIQ v1.0.2-hindsight</span>
            <span>Target Node: {activeBuyer.name}</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded bg-emerald-500"></div>
            <span className="uppercase tracking-tighter font-bold">Active Sync Cluster Optimized</span>
          </div>
        </footer>
      </div>

      {/* Slide-over Briefing Section */}
      <BriefingPanel
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        briefingMarkdown={briefingMarkdown}
        buyerName={activeBuyer.name}
        companyName={activeBuyer.company}
        isLoading={briefingLoading}
        isDark={isDark}
      />

      {/* Structured Debrief modal */}
      <DebriefForm
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
        onSubmit={handleDebriefSubmit}
        buyerId={activeBuyerId}
        isDark={isDark}
      />

      {/* Track New Account focus modal */}
      <AddBuyerForm
        isOpen={isAddBuyerOpen}
        onClose={() => setIsAddBuyerOpen(false)}
        onSubmit={handleCreateBuyer}
        isDark={isDark}
      />

      {/* Auth Screen Modal Overlay */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <AuthScreen isDark={isDark} onClose={() => setIsAuthOpen(false)} />
        </div>
      )}

      {/* FLOATING CORNER AI AGENT CHAT BUTTON & WINDOW */}
      {currentView !== 'dashboard' && (
        <>
          {/* Floating Action Trigger Button with glowing pulses for high visual fidelity */}
          <button
            id="floating-chat-trigger"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`fixed bottom-12 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer select-none border group hover:scale-105 active:scale-95 ${
              isChatOpen 
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-600/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/40 opacity-100'
            }`}
            title="Toggle SalesIQ Agent Chat"
          >
            <div className="relative">
              {!isChatOpen && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black animate-pulse z-10" />
              )}
              {isChatOpen ? (
                <X className="w-5.5 h-5.5 animate-none" />
              ) : (
                <MessageSquare className="w-5.5 h-5.5 text-white group-hover:rotate-12 transition-transform duration-200" />
              )}
            </div>
            
            {/* Expanded elegant hover label on desktop */}
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out text-[10px] font-bold uppercase font-mono tracking-wider ml-0 group-hover:ml-2 select-none pointer-events-none whitespace-nowrap">
              {isChatOpen ? "Hide Agent" : "Consult SalesIQ"}
            </span>
          </button>

          {/* Floating Expandable Chat Panel - responsive sizes supporting mobile sheets and desktop cards */}
          {isChatOpen && (
            <div 
              id="floating-chat-window"
              className={`fixed bottom-[74px] right-4 left-4 sm:left-auto sm:right-6 z-40 w-[calc(100vw-32px)] sm:w-[480px] h-[60vh] min-h-[400px] max-h-[700px] flex flex-col border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-305 transform scale-100 origin-bottom-right ${
                isDark 
                  ? 'bg-zinc-950/95 border-zinc-800 text-white shadow-zinc-950/80' 
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40'
              }`}
            >
              {/* Context Info header */}
              <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors duration-205 ${
                isDark ? 'bg-black border-zinc-900 text-white' : 'bg-slate-50 border-slate-150 text-slate-850'
              }`}>
                <div className="flex items-center gap-2.5">
                  <img 
                    src={activeBuyer.avatar} 
                    alt={activeBuyer.name}
                    referrerPolicy="no-referrer"
                    className={`w-8 h-8 rounded-full border object-cover shadow-2xs shrink-0 ${isDark ? 'border-zinc-800' : 'border-slate-205'}`}
                  />
                  <div>
                    <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5 font-sans">
                      {activeBuyer.name}
                    </h3>
                    <p className={`text-[9.5px] font-mono leading-none mt-0.5 uppercase tracking-wide font-bold ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}>{activeBuyer.role} @ {activeBuyer.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[7.5px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded font-black tracking-tight shrink-0">
                      SALESIQ ACTIVE
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-slate-200 text-slate-450'}`}
                    title="Minimize"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MESSAGE CHRONICLE */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                {/* Seeded Intro card */}
                <div id="floating-msg-intro" className={`flex gap-3 mr-auto border p-3.5 rounded-xl transition-colors duration-200 ${
                  isDark ? 'bg-black/60 border-zinc-850 text-zinc-300 shadow-none' : 'bg-slate-100/50 border-slate-150 text-slate-705'
                }`}>
                  <div className={`p-1.5 self-start border rounded-lg shadow-3xs ${
                    isDark ? 'bg-indigo-950/80 border-indigo-900 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[8.5px] font-bold font-mono tracking-wider uppercase ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>System Intelligence Connected</span>
                    <p className="text-[11px] leading-relaxed">
                      How should we approach **{activeBuyer.name}** today? Ask about target tech objections, competitors, or specific cases on file.
                    </p>
                  </div>
                </div>

                {/* Chat items */}
                {chatHistory.filter(m => m.role !== 'system').map((m, i) => (
                  <div 
                    key={i} 
                    id={`floating-msg-${i}`}
                    className={`flex gap-2.5 max-w-[95%] sm:max-w-[90%] break-words min-w-0 transition-all duration-200 ${
                      m.role === 'user' ? 'flex-row-reverse ml-auto' : ''
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <div className={`p-1.5 self-start border rounded-lg shadow-2xs transition-colors duration-200 shrink-0 ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-indigo-400' : 'bg-white border-slate-150 text-indigo-600'
                      }`}>
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    <div className={`flex-1 overflow-hidden ${m.role === 'user' ? 'text-right' : ''}`}>
                      <span className={`block text-[8px] font-bold font-mono tracking-wider uppercase ${isDark ? 'text-zinc-500' : 'text-slate-450'}`}>
                        {m.role === 'user' ? 'Rep (You)' : 'SalesIQ Specialist'}
                      </span>
                      
                      {m.isBeforeAfter && m.beforeContent && m.afterContent ? (
                        <BeforeAfterResponse 
                          beforeContent={m.beforeContent} 
                          afterContent={m.afterContent} 
                          isDark={isDark}
                        />
                      ) : (
                        <div className={`text-xs mt-1 leading-relaxed break-words whitespace-pre-wrap font-sans transition-colors duration-200 ${
                          m.role === 'user' 
                            ? (isDark ? 'inline-block bg-indigo-900/50 text-white p-3 rounded-2xl' : 'inline-block bg-indigo-600 text-white p-3 rounded-2xl shadow-3xs') 
                            : (isDark ? 'text-zinc-200' : 'text-slate-800')
                        }`}>{m.content}</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking status */}
                {chatLoading && (
                  <div id="floating-chat-thinking" className={`flex gap-2 mr-auto items-center py-2 animate-pulse border rounded-xl px-3 w-fit transition-colors duration-200 ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-indigo-400' : 'bg-slate-50 border-slate-205 text-indigo-600 shadow-3xs'
                  }`}>
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                    <span className="text-[10px] font-mono font-medium">Scanning Retrospective timeline...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT SECTION */}
              <div className={`p-3 border-t transition-colors duration-200 ${
                isDark ? 'bg-black border-zinc-900' : 'bg-slate-50 border-slate-200'
              }`}>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Stop listening" : "Start voice dictation"}
                    className={`p-2 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                      isListening 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-sm' 
                        : (isDark ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-205 text-slate-555 hover:bg-slate-300')
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white animate-pulse" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input
                    id="floating-chat-input"
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Ask SalesIQ tactical advice...`}
                    className={`flex-grow text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-550 placeholder-slate-400 font-sans transition-all ${
                      isDark 
                        ? 'bg-zinc-900 border border-zinc-805 text-white focus:bg-black focus:border-indigo-500' 
                        : 'bg-white border border-slate-250 text-slate-800 focus:border-indigo-500'
                    }`}
                    disabled={chatLoading}
                  />
                  <button
                    id="floating-chat-send"
                    type="submit"
                    disabled={chatLoading || !inputMessage.trim()}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold rounded-xl text-white transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs shrink-0"
                  >
                    <span>Ask</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
                <div className={`mt-2 text-[8px] font-mono px-1 select-none flex justify-between ${
                  isDark ? 'text-zinc-650' : 'text-slate-400'
                }`}>
                  <span>Context: {activeBuyer.company}</span>
                  <span>Supports Voice dictation and timeline checks.</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
