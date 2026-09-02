import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { useLang } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { Mail, Lock, User, KeyRound, ArrowRight, Upload, Phone, FileText, CheckCircle2, ShieldCheck, Camera, CreditCard, Activity, Briefcase, MapPin, Building, Globe, AlignLeft, Scale, Map, UserCircle2, AlertCircle, RefreshCw, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

import { API_BASE } from '../config/api';

export default function UserAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginManual, user, logout } = useUserAuth();
  const { t } = useLang();

  const initialMode = searchParams.get('mode') as 'login' | 'register' | 'upgrade' || 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'upgrade'>(initialMode);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Explicitly clear all fields on mount to prevent any caching
    setName('');
    setEmail('');
    setPassword('');
    setError('');

    // Only redirect away if the user is fully logged in and not an applicant needing upgrade
    if (user && !user.isApplicant && mode !== 'upgrade') {
      navigate('/user/dashboard');
    }
    // If they are an applicant and landed here without upgrade mode, force upgrade mode
    if (user && user.isApplicant && mode !== 'upgrade') {
      setMode('upgrade');
    }
  }, [user, navigate, mode]);

  const validateForm = () => {
    if (!email) {
      setError(t('validation:emailRequired', 'Email address is required'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('validation:emailInvalid', 'Please enter a valid email address'));
      return false;
    }
    if (!password) {
      setError(t('validation:passwordRequired', 'Password is required'));
      return false;
    }
    if (password.length < 6) {
      setError(t('validation:passwordShort', 'Password must be at least 6 characters long'));
      return false;
    }
    if (mode === 'register') {
      if (!name) {
        setError(t('validation:nameRequired', 'Full name is required for registration'));
        return false;
      }
      if (!phone) {
        setError(t('validation:phoneRequired', 'Phone number is required'));
        return false;
      }
      if (!dob) {
        setError(t('validation:dobRequired', 'Date of birth is required'));
        return false;
      }
      if (!address) {
        setError(t('validation:addressRequired', 'Address is required'));
        return false;
      }
      if (!occupation) {
        setError(t('validation:occupationRequired', 'Occupation is required'));
        return false;
      }
    }
    return true;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    let endpoint = '/api/user/login';
    let bodyData: any = { email, password };
    
    if (mode === 'register') {
      endpoint = '/api/user/register';
      bodyData = { name, email, password, phone, dob, address, occupation };
    } else if (mode === 'upgrade') {
      endpoint = '/api/user/upgrade';
      bodyData = { userId: user?.userId, email, password };
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || t('auth:authFailed', 'Authentication failed'));
      loginManual(data.token, data.name || user?.name || '', data.userId);
      navigate('/user/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setGoogleLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      if (!googleUser.email) {
        throw new Error(t('auth:googleNoEmail', 'Google account must have an email address attached.'));
      }

      // Send to backend to register or login and get JWT
      const res = await fetch(`${API_BASE}/api/user/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: googleUser.email, 
          name: googleUser.displayName || 'Google User' 
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || t('auth:googleAuthFailed', 'Google Authentication failed'));
      
      loginManual(data.token, data.name, data.userId);
      navigate('/user/dashboard');
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError(t('auth:googlePopupClosed', 'Sign-in popup was closed before completion.'));
      } else {
        setError(err.message || t('auth:googleAuthError', 'Failed to authenticate with Google.'));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Controls */}
        <div className="flex justify-end items-center gap-3 mb-4">
          <ThemeToggle />
          <LanguageSwitcher compact />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4 shadow-lg shadow-blue-500/25">
            <UserCircle2 size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? t('auth:welcomeBack', 'Welcome Back') : mode === 'upgrade' ? t('auth:completeProfile', 'Complete Profile') : t('auth:createAccount', 'Create Account')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'login' ? t('auth:signInSub', 'Sign in to access your dashboard') : mode === 'upgrade' ? t('auth:setEmailPass', 'Set an email and password for your dashboard') : t('auth:startJourney', 'Start your loan journey today')}
          </p>
        </div>

        {/* Mode Toggle (Hidden in Upgrade Mode) */}
        {mode !== 'upgrade' && (
          <div className="flex bg-secondary border border-border p-1 rounded-xl mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? t('auth:login', 'Login') : t('auth:register', 'Register')}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="bg-card border border-border backdrop-blur-xl rounded-2xl p-6 shadow-2xl space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wider">{t('auth:fullName', 'Full Name')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={loading || googleLoading}
                  autoComplete="off"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pl-9 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50"
                  placeholder={t("auth:namePlaceholder", "Shivshankar Mali")} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wider">{t('auth:email', 'Email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading || googleLoading}
                autoComplete="off"
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-9 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50"
                placeholder={t("auth:emailPlaceholder", "you@example.com")} />
            </div>
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground text-[10px] font-medium mb-1.5 uppercase tracking-wider">{t('auth:phone', 'Phone')}</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading || googleLoading}
                    className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50" placeholder="Phone Number" />
                </div>
              </div>
              <div>
                <label className="block text-muted-foreground text-[10px] font-medium mb-1.5 uppercase tracking-wider">{t('auth:dob', 'Date of Birth')}</label>
                <div className="relative">
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} disabled={loading || googleLoading}
                    className="w-full bg-secondary border border-border rounded-xl py-2 px-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-muted-foreground text-[10px] font-medium mb-1.5 uppercase tracking-wider">{t('auth:address', 'Full Address')}</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} disabled={loading || googleLoading}
                    className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50" placeholder="123 Main St, City, State" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-muted-foreground text-[10px] font-medium mb-1.5 uppercase tracking-wider">{t('auth:occupation', 'Occupation')}</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} disabled={loading || googleLoading}
                    className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50" placeholder="e.g. Software Engineer, Shop Owner" />
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-muted-foreground text-xs font-medium uppercase tracking-wider">{t('auth:password', 'Password')}</label>
              {mode === 'login' && (
                <button type="button" className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  {t('auth:forgotPassword', 'Forgot password?')}
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} disabled={loading || googleLoading}
                autoComplete="new-password"
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-9 pr-12 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors text-sm disabled:opacity-50"
                placeholder={t("auth:passPlaceholder", "••••••••")} />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? (
              <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Lock size={16} />{mode === 'login' ? t('auth:signIn', 'Sign In') : mode === 'upgrade' ? t('auth:completeRegistration', 'Complete Registration') : t('auth:createAccountBtn', 'Create Account')}<ArrowRight size={16} /></>
            )}
          </button>

          {/* OR Divider and Google Auth (Hidden in Upgrade Mode) */}
          {mode !== 'upgrade' && (
            <>
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">{t('common:or', 'OR')}</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <button type="button" disabled={loading || googleLoading} onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 text-foreground border border-border py-3 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {googleLoading ? (
                  <div className="w-5 h-5 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('auth:continueWithGoogle', 'Continue with Google')}
                  </>
                )}
              </button>
            </>
          )}

          {/* Toggle between Login/Register without the ugly tabs, optionally handled here if they prefer standard text links */}
          {mode !== 'upgrade' && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  {t('auth:noAccount', "Don't have an account?")}{' '}
                  <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    {t('auth:signUp', 'Sign up')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth:hasAccount', 'Already have an account?')}{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    {t('auth:signInAction', 'Sign in')}
                  </button>
                </>
              )}
            </div>
          )}
        </form>

        {mode === 'upgrade' ? (
          <div className="mt-4 space-y-3">
            <button onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
              <ChevronRight size={14} className="rotate-180" />
              {t("common:backToHome", "Back to Home")}
            </button>
            <button onClick={() => { logout(); navigate('/'); }}
              className="w-full text-center text-red-400 hover:text-red-300 text-xs transition-colors">
              {t("auth:cancelLogout", "Cancel & Logout")}
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/')}
            className="mt-6 w-full flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ChevronRight size={14} className="rotate-180" />
            {t("common:backToHome", "Back to Home")}
          </button>
        )}
      </div>
    </div>
  );
}
