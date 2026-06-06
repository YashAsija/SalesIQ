import React, { useState } from 'react';
import { useAuth } from '../AuthContext.js';
import { Sparkles, Brain, Lock, Mail, User, Briefcase, Building, Eye, EyeOff, Loader2, X } from 'lucide-react';

interface AuthScreenProps {
  isDark: boolean;
  onClose?: () => void;
}

export default function AuthScreen({ isDark, onClose }: AuthScreenProps) {
  const { logIn, signUp, logInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please provide both email and password.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, displayName, role, company);
      } else {
        await logIn(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'An unexpected error occurred.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password is weak. Make sure it is at least 6 characters.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email address or incorrect password.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password authentication is disabled in Firebase. Please enable it in the Firebase Console (Authentication -> Sign-in method -> Email/Password) or use "Continue with Google" below.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await logInWithGoogle();
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'An unexpected error occurred during Google authentication.';
      if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Google Sign-In is disabled. Please enable Google provider in the Firebase Console (Authentication -> Sign-in method).';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-250 ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-0 right-1 p-1 py-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
              title="Return to Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg font-mono shadow-md mb-3 animate-none">
            IQ
          </div>
          <h2 className="text-xl font-bold tracking-tight font-sans">
            SalesIQ Hindsight Portal
          </h2>
          <p className={`text-xs mt-1 font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            B2B Enterprise Sales Intelligence Engine
          </p>
        </div>

        {/* Auth Card */}
        <div className={`border rounded-2xl shadow-2xl p-6 transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-850 shadow-none' 
            : 'bg-white/90 backdrop-blur-md border-slate-205'
        }`}>
          <div className="flex border-b mb-6 pb-2 border-zinc-800 gap-4">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase font-mono relative cursor-pointer ${
                !isSignUp 
                  ? 'text-indigo-500 border-b-2 border-indigo-505 font-extrabold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase font-mono relative cursor-pointer ${
                isSignUp 
                  ? 'text-indigo-500 border-b-2 border-indigo-510 font-extrabold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 border ${
              isDark 
                ? 'bg-rose-950/30 text-rose-300 border-rose-900/60' 
                : 'bg-rose-50 text-rose-800 border-rose-150'
            }`}>
              <span className="font-bold text-rose-500 font-mono mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                {/* Full Name */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="e.g. Alex Mercer"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-510 transition ${
                        isDark
                          ? 'bg-zinc-900 border border-zinc-750 text-white placeholder-zinc-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-850 placeholder-slate-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Role / Job Title & Company Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}>
                      Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="auth-role"
                        type="text"
                        placeholder="e.g. Account Rep"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-510 transition ${
                          isDark
                            ? 'bg-zinc-900 border border-zinc-750 text-white placeholder-zinc-500'
                            : 'bg-slate-50 border border-slate-200 text-slate-850 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}>
                      Company
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="auth-company"
                        type="text"
                        placeholder="e.g. SalesIQ"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-510 transition ${
                          isDark
                            ? 'bg-zinc-900 border border-zinc-750 text-white placeholder-zinc-500'
                            : 'bg-slate-50 border border-slate-200 text-slate-850 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-510 transition ${
                    isDark
                      ? 'bg-zinc-900 border border-zinc-750 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-850 placeholder-slate-400'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-[10px] uppercase font-bold tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  Password <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-9 pr-10 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-510 transition ${
                    isDark
                      ? 'bg-zinc-900 border border-zinc-750 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-850 placeholder-slate-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-2 p-0.5 rounded cursor-pointer transition ${
                    isDark ? 'text-zinc-405 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-650 text-white font-bold text-xs rounded-lg active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs font-semibold mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create SalesIQ Account' : 'Authenticate License'}</span>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className={`w-full border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className={`px-2 font-mono ${isDark ? 'bg-zinc-950 text-zinc-500' : 'bg-white text-slate-400'}`}>Or</span>
            </div>
          </div>

          <button
            id="auth-google-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className={`w-full py-2.5 flex items-center justify-center gap-2.5 text-xs font-bold rounded-lg border transition cursor-pointer active:scale-98 ${
              isDark 
                ? 'bg-zinc-900 border-zinc-750 text-zinc-300 hover:text-white hover:bg-zinc-800' 
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.37 0 3.39 2.659 1.486 6.555l3.78 3.21z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.825-.075-1.618-.215-2.382H12v4.512h6.458a5.518 5.518 0 01-2.396 3.618l3.722 2.887c2.178-2.007 3.708-4.961 3.708-8.635z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235L1.486 17.45A11.954 11.954 0 0012 24c3.055 0 5.864-1.012 8.006-2.738l-3.722-2.887a7.11 7.11 0 01-4.284 1.253 7.077 7.077 0 01-6.734-4.86l-3.21 3.21z"
              />
              <path
                fill="#34A853"
                d="M12 19.375c-2.35 0-4.385-1.15-5.63-2.912l-3.78 3.21c2.172 3.682 6.136 6.327 10.74 6.327 3.055 0 5.864-1.012 8.006-2.738l-3.722-2.887a7.11 7.11 0 01-4.284 1.253z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Notice */}
          <div className={`mt-6 pt-4 border-t border-dashed text-center text-[10px] leading-relaxed ${
            isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-150 text-slate-400'
          }`}>
            <span>Protected by localized Zero-Trust secure Firestore validation. Data resourced within sandbox execution zones.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
