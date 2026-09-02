import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, KeyRound, ArrowRight, ShieldCheck, AlertCircle, Briefcase, Eye, EyeOff } from 'lucide-react';

import ThemeToggle from '../components/ThemeToggle';
import { API_BASE } from '../config/api';

export default function AdminAuth({ expectedRole }: { expectedRole?: 'admin' | 'loan_officer' }) {
  const navigate = useNavigate();
  const role = expectedRole || 'admin';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    // Ensure form is completely clear on mount
    setUsername('');
    setPassword('');
    setError('');

    // If the token is already present on this device, skip auth.
    const token = localStorage.getItem('admin_token');
    const storedRole = localStorage.getItem('admin_role');
    if (token) {
      if (storedRole === 'loan_officer') {
        navigate('/loan-officer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/admin/login' : '/api/admin/register';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (expectedRole && data.role !== expectedRole) {
        throw new Error('Access denied. Incorrect portal for this role.');
      }

      // Safe locally to remember the device
      localStorage.setItem('admin_token', data.token || data.id);
      if (data.role) {
        localStorage.setItem('admin_role', data.role);
      }
      
      if (data.role === 'loan_officer') {
        navigate('/loan-officer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 transition-colors duration-500">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none ${role === 'loan_officer' ? 'bg-emerald-600/10' : 'bg-blue-600/10'}`} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${role === 'loan_officer' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25' : 'bg-gradient-to-br from-blue-600 to-violet-600 shadow-blue-500/25'}`}>
            {role === 'loan_officer' ? (
              <Briefcase size={30} className="text-white" />
            ) : (
              <ShieldCheck size={30} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {role === 'loan_officer' ? 'Loan Officer Portal' : 'Admin Access'}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {role === 'loan_officer' ? 'Sign in to review and verify applications' : 'Sign in to manage the platform'}
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="bg-card border border-border backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-12 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 mt-6 hover:opacity-90 text-white py-3 rounded-xl font-medium transition-all ${role === 'loan_officer' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-violet-600'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Lock size={18} /> Secure Login <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <button onClick={() => navigate('/')}
          className="mt-6 w-full flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
          Back to Home
        </button>
      </div>
    </div>
  );
}
