import React, { useState } from 'react';
import { X, User, Building, Briefcase, Plus, Sparkles, Check } from 'lucide-react';

interface AddBuyerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, company: string, role: string) => Promise<any>;
  isDark?: boolean;
}

export default function AddBuyerForm({ isOpen, onClose, onSubmit, isDark = false }: AddBuyerFormProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Buyer name is required');
    if (!company.trim()) return setError('Company name is required');
    if (!role.trim()) return setError('Role / Job title is required');

    setIsSubmitting(true);
    try {
      await onSubmit(name, company, role);
      // Reset form on success
      setName('');
      setCompany('');
      setRole('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add focus account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="add-buyer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      {/* Backdrop click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal Container */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-xl border overflow-hidden p-6 transition-all transform animate-[fadeIn_0.2s_ease-out] ${
        isDark ? 'bg-zinc-950 border-zinc-900 text-white shadow-zinc-900/40' : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b pb-3.5 border-dashed border-slate-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.2 rounded bg-indigo-650 text-white font-bold text-[9.5px] font-mono tracking-wide uppercase select-none flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-350" />
              <span>HINDSIGHT PRO</span>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-tight font-sans">
              Focus New Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className={`text-[11px] leading-relaxed mb-4 font-mono select-none ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          Initialize a clean, persistent retrospective memory ledger to track sales calls, stakeholder objections, and live competitor plays for a new target buyer.
        </p>

        {/* Error message */}
        {error && (
          <div id="add-buyer-error" className="mb-4 p-2.5 rounded-lg border bg-rose-50 border-rose-200 text-rose-700 text-xs font-medium [text-wrap:balance]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase font-mono tracking-wide mb-1.5 select-none ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Buyer Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-zinc-500">
                <User className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Richard Hendricks"
                disabled={isSubmitting}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 transition-all ${
                  isDark 
                    ? 'bg-black border-zinc-800 text-white focus:border-indigo-500 focus:ring-indigo-500 placeholder-zinc-600' 
                    : 'bg-slate-50/50 border-slate-205 text-slate-900 focus:border-indigo-550 focus:ring-indigo-550 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Company Field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase font-mono tracking-wide mb-1.5 select-none ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Company Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-zinc-500">
                <Building className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Pied Piper Inc."
                disabled={isSubmitting}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 transition-all ${
                  isDark 
                    ? 'bg-black border-zinc-800 text-white focus:border-indigo-500 focus:ring-indigo-500 placeholder-zinc-600' 
                    : 'bg-slate-50/50 border-slate-205 text-slate-900 focus:border-indigo-550 focus:ring-indigo-550 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Role Field */}
          <div>
            <label className={`block text-[10px] font-bold uppercase font-mono tracking-wide mb-1.5 select-none ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Buyer Job Title
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-zinc-500">
                <Briefcase className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. CEO & Founder"
                disabled={isSubmitting}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 transition-all ${
                  isDark 
                    ? 'bg-black border-zinc-800 text-white focus:border-indigo-500 focus:ring-indigo-500 placeholder-zinc-600' 
                    : 'bg-slate-50/50 border-slate-205 text-slate-900 focus:border-indigo-550 focus:ring-indigo-550 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-2 text-xs font-semibold">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 py-2 rounded-xl border text-center transition cursor-pointer select-none ${
                isDark 
                  ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs select-none ${
                isSubmitting ? 'opacity-80' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Focusing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Track Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
