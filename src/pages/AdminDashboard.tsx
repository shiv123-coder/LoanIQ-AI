import React, { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ChevronDown, CheckCircle, AlertCircle, XCircle,
  TrendingUp, Download, Eye, MapPin, ExternalLink, RefreshCw,
  Trash2, History, RotateCcw, ShieldAlert, Clock, LogOut, ThumbsUp, ThumbsDown, Shield, UserPlus, UserMinus, Edit, UserCog
} from 'lucide-react';
import { toast } from 'sonner';

import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import CountUp from 'react-countup';
import { AdminTableSkeleton } from '../components/SkeletonLoaders';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { API_BASE } from '../config/api';
import { generateSanctionLetter } from '../lib/pdfGenerator';
import { addNotification } from '../lib/notificationService';

export default function AdminDashboard() {
  const [apps, setApps] = useState<any[]>([]);
  const [trash, setTrash] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<'active' | 'trash' | 'staff' | 'users'>('active');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Staff creation form
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');

  const navigate = useNavigate();

  async function handleUpdateDecision(app: any, decision: 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'SENT_BACK') {
    const label = decision === 'DISBURSED' ? 'mark as disbursed' : decision === 'SENT_BACK' ? 'send back' : decision.toLowerCase();
    if (!confirm(`Are you sure you want to ${label} this application?`)) return;
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/applications/${app.id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await resp.json();
      if (data.success) {
        toast.success(`Application ${decision} successfully`);
        
        // Notifications are now handled securely by the backend in adminRoutes.js
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    navigate('/');
  }

  useEffect(() => {
    if (currentTab !== 'active') return;

    const token = localStorage.getItem('admin_token');
    const eventSource = new EventSource(`${API_BASE}/api/admin/applications/stream?token=${token}`);
    
    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') {
          setIsConnected(true);
        } else if (payload.type === 'update') {
          setApps(payload.data || []);
          setLoading(false);
          setError('');
          setIsConnected(true);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Live stream connection lost. Attempting to reconnect...');
    };

    return () => {
      eventSource.close();
    };
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === 'trash') {
      fetchTrash();
    } else if (currentTab === 'staff') {
      fetchStaff();
    } else if (currentTab === 'users') {
      fetchUsers();
    }
  }, [currentTab]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/users`);
      const data = await resp.json();
      if (data.success) {
        setAllUsers(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaff() {
    setLoading(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/staff`);
      const data = await resp.json();
      if (data.success) {
        setStaff(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffUsername || !newStaffPassword) {
      toast.error('Username and password are required');
      return;
    }
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newStaffUsername, password: newStaffPassword, role: 'loan_officer' })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success('Loan Officer created successfully');
        setNewStaffUsername('');
        setNewStaffPassword('');
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to create staff');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/staff/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        toast.success('Staff member deleted');
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to delete staff');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function fetchTrash() {
    setLoading(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/trash`);
      const data = await resp.json();
      if (data.success) {
        setTrash(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch trash');
    } finally {
      setLoading(false);
    }
  }

  async function handleSoftDelete(id: string) {
    if (!confirm('Move this application to Expiry Section? It will be permanently deleted after 3 days.')) return;
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/applications/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        toast.success('Application moved to Expiry Section');
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRestore(id: string) {
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/trash/${id}/restore`, { method: 'POST' });
      const data = await resp.json();
      if (data.success) {
        toast.success('Application restored');
        fetchTrash();
      } else {
        toast.error(data.error || 'Restore failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm('Permanently delete this application? This action cannot be undone.')) return;
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/trash/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        toast.success('Application permanently deleted');
        fetchTrash();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEmptyTrash() {
    if (!confirm('Permanently delete ALL expired applications? This action cannot be undone.')) return;
    setIsProcessing(true);
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/admin/trash`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        toast.success(`Successfully deleted ${data.count} applications`);
        fetchTrash();
      } else {
        toast.error(data.error || 'Failed to empty trash');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredApps = currentTab === 'active' 
    ? (filter ? apps.filter((a: any) => {
        if (filter === 'APPROVED') return a.decision === 'APPROVED';
        if (filter === 'DISBURSED') return a.decision === 'DISBURSED';
        if (filter === 'REJECTED') return a.decision === 'REJECTED';
        if (filter === 'SENT_BACK') return a.decision === 'SENT_BACK';
        return true;
      }) : apps)
    : trash;

  const stats = {
    total: apps.length,
    pendingFinal: apps.filter((a: any) => a.decision === 'APPROVED').length,
    disbursed: apps.filter((a: any) => a.decision === 'DISBURSED').length,
    rejected: apps.filter((a: any) => a.decision === 'REJECTED').length,
    sentBack: apps.filter((a: any) => a.decision === 'SENT_BACK').length,
    totalValueDisbursed: apps.filter((a: any) => a.decision === 'DISBURSED').reduce((acc: number, curr: any) => acc + (curr.financialDetails?.requestedAmount || 0), 0),
    fraudExposurePrevented: apps.filter((a: any) => a.decision === 'REJECTED').reduce((acc: number, curr: any) => acc + (curr.financialDetails?.requestedAmount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block tracking-tight">LoanIQ <span className="text-muted-foreground font-medium">Admin Portal</span></span>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell role="admin" />
            
            <div className="w-px h-6 bg-border mx-1" />
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-colors ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-colors ml-1"
              title="My Profile"
            >
              <UserCog size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors ml-1"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Glassmorphic Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-indigo-600/10 to-rose-600/10 border border-white/10 dark:border-white/5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 blur-[80px] rounded-full mix-blend-screen" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                Executive <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-500">Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
                Oversee the entire lending pipeline. Finalize sanctioned loans, manage applications, and control staff access with administrative privileges.
              </p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-background/50 backdrop-blur-md p-1.5 border border-border rounded-xl shadow-lg gap-2">
              <button
                onClick={() => { setCurrentTab('active'); setFilter(null); }}
                className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  currentTab === 'active' ? 'bg-primary text-white-always shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <History size={16} /> Applications
              </button>
              <button
                onClick={() => setCurrentTab('users')}
                className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  currentTab === 'users' ? 'bg-blue-600 text-white-always shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Users size={16} /> Users
              </button>
              <button
                onClick={() => setCurrentTab('staff')}
                className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  currentTab === 'staff' ? 'bg-violet-600 text-white-always shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Shield size={16} /> Staff
              </button>
              <button
                onClick={() => setCurrentTab('trash')}
                className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  currentTab === 'trash' ? 'bg-destructive text-white-always shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Trash2 size={16} /> Expiry
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3 animate-in fade-in">
            <XCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Financial KPI Stats (Only in Active Tab) */}
        {currentTab === 'active' && !loading && apps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-75">
            <div className="group relative overflow-hidden bg-card border border-emerald-500/20 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 bg-emerald-500 transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-2 text-emerald-500 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp size={20} /></div>
                <span className="text-xs font-bold uppercase tracking-wider leading-tight">Total Value Disbursed</span>
              </div>
              <div className="text-4xl font-black text-emerald-500 flex items-center gap-1">
                <span className="text-2xl text-emerald-500/50">₹</span>
                <CountUp end={stats.totalValueDisbursed} duration={2.5} separator="," preserveValue />
              </div>
            </div>

            <div className="group relative overflow-hidden bg-card border border-red-500/20 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 bg-red-500 transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-2 text-red-500 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10"><ShieldAlert size={20} /></div>
                <span className="text-xs font-bold uppercase tracking-wider leading-tight">Fraud Exposure Prevented</span>
              </div>
              <div className="text-4xl font-black text-red-500 flex items-center gap-1">
                <span className="text-2xl text-red-500/50">₹</span>
                <CountUp end={stats.fraudExposurePrevented} duration={2.5} separator="," preserveValue />
              </div>
            </div>
          </div>
        )}

        {/* Application Overview Stats (Only in Active Tab) */}
        {currentTab === 'active' && !loading && apps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {[
              { label: 'Total Apps', value: stats.total, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: <Users size={18} />, key: null },
              { label: 'Pending Final', value: stats.pendingFinal, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: <AlertCircle size={18} />, key: 'APPROVED' },
              { label: 'Disbursed', value: stats.disbursed, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle size={18} />, key: 'DISBURSED' },
              { label: 'Rejected', value: stats.rejected, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle size={18} />, key: 'REJECTED' },
              { label: 'Sent Back', value: stats.sentBack, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', icon: <RotateCcw size={18} />, key: 'SENT_BACK' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setFilter(s.key === filter ? null : s.key)}
                className={`group relative overflow-hidden bg-card border rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                  filter === s.key ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/40 hover:shadow-md'
                }`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 transition-transform group-hover:scale-110 ${s.bg}`} />
                <div className={`flex items-center gap-2 ${s.color} mb-3`}>
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{s.label}</span>
                </div>
                <div className={`text-3xl font-extrabold ${s.color}`}>
                  <CountUp end={s.value} duration={2.5} preserveValue />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Staff Management */}
        {currentTab === 'staff' && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Shield className="text-violet-500" /> Manage Loan Officers
            </h2>
            
            <form onSubmit={handleCreateStaff} className="mb-8 p-6 bg-secondary/30 rounded-2xl border border-border flex flex-col sm:flex-row items-end gap-4 shadow-inner">
              <div className="w-full sm:w-1/3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">New Username</label>
                <input 
                  type="text" 
                  value={newStaffUsername}
                  onChange={e => setNewStaffUsername(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-sm"
                  placeholder="e.g. officer_john"
                />
              </div>
              <div className="w-full sm:w-1/3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={newStaffPassword}
                  onChange={e => setNewStaffPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-violet-500/20"
              >
                <UserPlus size={16} /> Add Officer
              </button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  ) : staff.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium">No staff found.</td></tr>
                  ) : (
                    staff.map(s => (
                      <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{s.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-violet-500/10 text-violet-500'}`}>
                            {s.role === 'admin' ? 'Administrator' : 'Loan Officer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1">
                          <button
                            onClick={() => setEditingStaffId(s.id)}
                            className="p-2 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 rounded-xl transition-colors"
                            title="Edit staff"
                          >
                            <Edit size={18} />
                          </button>
                          {s.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteStaff(s.id)}
                              disabled={isProcessing}
                              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                              title="Delete staff"
                            >
                              <UserMinus size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management */}
        {currentTab === 'users' && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <UserCog className="text-blue-500" /> User Management
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Name / Email</th>
                    <th className="px-6 py-4">Phone / Address</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  ) : allUsers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium">No users found.</td></tr>
                  ) : (
                    allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{u.phone || '-'}</div>
                          <div className="text-xs text-muted-foreground">{u.address || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingUserId(u.id)}
                            className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                            title="Edit user"
                          >
                            <Edit size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Application List (Active & Trash) */}
        {(currentTab === 'active' || currentTab === 'trash') && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {currentTab === 'active' ? <Users size={18} className="text-indigo-500" /> : <Trash2 size={18} className="text-red-500" />}
                {currentTab === 'active' ? 'Master Pipeline' : 'Expiry Section'}
              </h2>
              <div className="flex items-center gap-4">
                {filter && (
                  <button onClick={() => setFilter(null)} className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:underline">
                    Clear Filter
                  </button>
                )}
                {currentTab === 'trash' && trash.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center gap-2 border border-red-500/20 hover:border-transparent"
                  >
                    <Trash2 size={16} /> Empty Trash
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Loan Details</th>
                    <th className="px-6 py-4">Credit / Risk</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Decision</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <AdminTableSkeleton rows={5} />
                  ) : filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${currentTab === 'active' ? 'bg-secondary' : 'bg-red-500/10'}`}>
                            {currentTab === 'active' ? <CheckCircle size={32} className="text-indigo-500" /> : <Trash2 size={32} className="text-red-500" />}
                          </div>
                          <h3 className="text-lg font-bold text-foreground">
                            {currentTab === 'active' ? 'Pipeline Clear' : 'Trash is Empty'}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {currentTab === 'active' ? 'No applications match the current filter.' : 'No expired applications found.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <Fragment key={app.id}>
                        <tr className={`hover:bg-secondary/30 transition-colors cursor-pointer ${currentTab === 'trash' ? 'opacity-70' : ''}`} onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-foreground">{app.customerDetails?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-1 bg-secondary inline-block px-1.5 py-0.5 rounded">{app.id}</div>
                            {app.customerDetails?.location && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 font-medium">
                                <MapPin size={10} /> Lat: {app.customerDetails.location.lat?.toFixed(2)}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="text-sm text-foreground font-bold">
                              ₹{(app.financialDetails?.requestedAmount || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                              {app.financialDetails?.loanPurpose} ({app.financialDetails?.jobType})
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                              INCOME: ₹{(app.financialDetails?.income || 0).toLocaleString('en-IN')}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-black ${
                                app.creditScore >= 751 ? 'text-emerald-500' : 
                                app.creditScore >= 491 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {app.creditScore}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold">/ 900</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                              Risk: <span className="text-foreground">{app.riskLevel}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 space-y-1.5">
                            <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
                              <span className={`px-2 py-1 rounded-md ${app.verification?.liveness ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                Liveness: {app.verification?.liveness ? 'Pass' : 'Fail'}
                              </span>
                            </div>
                            <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
                              <span className={`px-2 py-1 rounded-md ${app.verification?.panVerified ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                PAN: {app.verification?.panVerified ? 'Verified' : 'Missing'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <DecisionBadge decision={app.decision} />
                            {app.offer && (
                              <div className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-wider">
                                Offer: ₹{app.offer.offeredAmount.toLocaleString('en-IN')}
                              </div>
                            )}
                            {app.paymentLink && (
                              <a href={app.paymentLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 mt-1 font-bold uppercase tracking-wider underline">
                                <ExternalLink size={10} /> EMI Link
                              </a>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {currentTab === 'active' ? (
                                <button
                                  disabled={isProcessing}
                                  onClick={(e) => { e.stopPropagation(); handleSoftDelete(app.id); }}
                                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  title="Move to trash"
                                >
                                  <Trash2 size={18} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    disabled={isProcessing}
                                    onClick={(e) => { e.stopPropagation(); handleRestore(app.id); }}
                                    className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                    title="Restore"
                                  >
                                    <RotateCcw size={18} />
                                  </button>
                                  <button
                                    disabled={isProcessing}
                                    onClick={(e) => { e.stopPropagation(); handlePermanentDelete(app.id); }}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete permanently"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                              <button
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition"
                              >
                                <ChevronDown size={20} className={`transform transition-transform duration-300 ${expandedId === app.id ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded View */}
                        {expandedId === app.id && (
                          <tr className="bg-secondary/10 border-t border-border">
                            <td colSpan={6} className="px-6 py-6">
                              {currentTab === 'trash' && (
                                <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider">
                                  <Clock size={16} />
                                  <span>Expiring in approximately {Math.ceil(((app.expiryAt || 0) - Date.now()) / (24 * 60 * 60 * 1000))} days</span>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full" />
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 relative z-10">
                                    <TrendingUp size={16} className="text-indigo-500" /> AI Explanation
                                  </h4>
                                  <p className="text-sm text-foreground leading-relaxed bg-background p-4 rounded-xl border border-border shadow-inner font-medium">
                                    {app.explanation}
                                  </p>
                                </div>

                                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full" />
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 relative z-10">
                                    <ShieldAlert size={16} className="text-rose-500" /> Explainable AI Audit Trail
                                  </h4>
                                  <ul className="text-xs text-foreground space-y-2">
                                    {(app.auditTrail || app.adjustments)?.map((adj: any, i: number) => (
                                      <li key={i} className="flex justify-between items-center bg-background px-4 py-2.5 rounded-xl border border-border shadow-sm">
                                        <span className="font-semibold">{adj.reason || adj.factor}</span>
                                        <span className={`font-black ${adj.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                          {adj.delta >= 0 ? '+' : ''}{adj.delta}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-background border border-border rounded-2xl shadow-sm">
                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                  {(app.decision === 'APPROVED' || app.decision === 'DISBURSED') && (
                                    <>
                                      <button 
                                        onClick={() => generateSanctionLetter(app)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-blue-500/20"
                                      >
                                        <Download size={16} /> Sanction Letter
                                      </button>
                                      {app.decision === 'APPROVED' && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); toast.success('Disbursing via RazorpayX Test API...'); setTimeout(() => handleUpdateDecision(app, 'DISBURSED'), 1500); }}
                                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2b66ff] hover:bg-[#02042b] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 border border-transparent"
                                        >
                                          <ExternalLink size={16} /> Disburse via RazorpayX
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                                
                                {currentTab === 'active' && app.decision === 'APPROVED' && (
                                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                    <button
                                      disabled={isProcessing}
                                      onClick={(e) => { e.stopPropagation(); handleUpdateDecision(app, 'REJECTED'); }}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/30 rounded-xl transition-all shadow-sm"
                                    >
                                      <ThumbsDown size={14} /> Reject
                                    </button>
                                    <button
                                      disabled={isProcessing}
                                      onClick={(e) => { e.stopPropagation(); handleUpdateDecision(app, 'SENT_BACK'); }}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 hover:text-white bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 rounded-xl transition-all shadow-sm"
                                    >
                                      <RotateCcw size={14} /> Send Back
                                    </button>
                                    <button
                                      disabled={isProcessing}
                                      onClick={(e) => { e.stopPropagation(); handleUpdateDecision(app, 'DISBURSED'); }}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 rounded-xl transition-all shadow-md shadow-emerald-500/20"
                                    >
                                      <ThumbsUp size={16} /> Disburse
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      {editingStaffId && <AdminStaffEditModal onClose={() => setEditingStaffId(null)} staffId={editingStaffId} staffData={staff.find(s => s.id === editingStaffId)} />}
      {editingUserId && <AdminUserEditModal onClose={() => setEditingUserId(null)} userId={editingUserId} userData={allUsers.find(u => u.id === editingUserId)} />}
      {showProfileModal && <AdminProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
}

function AdminProfileModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', username: '' });
  const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '', address: '', username: '' });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/admin/profile`, {}, 'admin');
        const data = await res.json();
        if (data.success) {
          const loadedProfile = {
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
            username: data.data.username || ''
          };
          setProfile(loadedProfile);
          setOriginalProfile(loadedProfile);
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/admin/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address
        })
      }, 'admin');
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully.');
        setOriginalProfile(profile);
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">My Profile</h2>
          <div className="flex items-center gap-2">
            {!loading && !isEditing && (
              <>
                <button onClick={() => setShowPasswordModal(true)} className="px-3 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
                  Change Password
                </button>
                <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="h-40 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Username</label>
              <input type="text" value={profile.username} disabled className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm opacity-70 cursor-not-allowed outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Address</label>
              <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setProfile(originalProfile);
                      setIsEditing(false);
                    }} 
                    className="px-4 py-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center min-w-[120px] transition-all shadow-md">
                    {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={onClose} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors">
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} role="admin" />}
    </div>
  );
}

function AdminStaffEditModal({ onClose, staffId, staffData }: { onClose: () => void, staffId: string, staffData: any }) {
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ username: staffData?.username || '', role: staffData?.role || 'loan_officer', password: '' });
  const [originalProfile, setOriginalProfile] = useState({ username: staffData?.username || '', role: staffData?.role || 'loan_officer', password: '' });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/admin/staff/${staffId}`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      }, 'admin');
      const data = await res.json();
      if (data.success) {
        toast.success('Staff updated successfully.');
        setOriginalProfile(profile);
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update staff');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Staff Member</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
              Edit Staff
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Username</label>
            <input type="text" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-violet-500'}`} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Role</label>
            <select value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed appearance-none' : 'focus:border-violet-500'}`}>
              <option value="loan_officer">Loan Officer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {isEditing && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
              <input type="password" value={profile.password} onChange={e => setProfile({...profile, password: e.target.value})} placeholder="Leave blank to keep unchanged" className="w-full mt-1 bg-secondary border border-border focus:border-violet-500 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setProfile(originalProfile);
                    setIsEditing(false);
                  }} 
                  className="px-4 py-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium flex items-center justify-center min-w-[120px] transition-all shadow-md">
                  {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors">
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUserEditModal({ onClose, userId, userData }: { onClose: () => void, userId: string, userData: any }) {
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialState = { 
    name: userData?.name || '', 
    phone: userData?.phone || '', 
    dob: userData?.dob || '', 
    address: userData?.address || '', 
    occupation: userData?.occupation || '' 
  };
  const [profile, setProfile] = useState(initialState);
  const [originalProfile, setOriginalProfile] = useState(initialState);

  useEffect(() => {
    if (userData) {
      const updatedState = {
        name: userData.name || '', 
        phone: userData.phone || '', 
        dob: userData.dob || '', 
        address: userData.address || '', 
        occupation: userData.occupation || '' 
      };
      setProfile(updatedState);
      setOriginalProfile(updatedState);
    }
  }, [userData]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      }, 'admin');
      const data = await res.json();
      if (data.success) {
        toast.success('User updated successfully.');
        setOriginalProfile(profile);
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Profile</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
              Edit User
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
            <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-blue-500'}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-blue-500'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Date of Birth</label>
              <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-blue-500'}`} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Address</label>
            <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-blue-500'}`} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Occupation</label>
            <input type="text" value={profile.occupation} onChange={e => setProfile({...profile, occupation: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-blue-500'}`} />
          </div>

          {userData?.documents && userData.documents.length > 0 && !isEditing && (
            <div className="pt-2 border-t border-border mt-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Uploaded Documents</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                {userData.documents.map((docUrl: string, idx: number) => (
                  <a key={idx} href={docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-secondary/50 border border-border rounded-lg hover:bg-secondary transition-colors group">
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md group-hover:scale-110 transition-transform">
                      <ExternalLink size={14} />
                    </div>
                    <span className="text-xs font-medium truncate">Document {idx + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setProfile(originalProfile);
                    setIsEditing(false);
                  }} 
                  className="px-4 py-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center justify-center min-w-[120px] transition-all shadow-md">
                  {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors">
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === 'DISBURSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
        <CheckCircle size={14} /> Disbursed
      </span>
    );
  }
  if (decision === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle size={14} /> Final Approved
      </span>
    );
  }
  if (decision === 'SENT_BACK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
        <RotateCcw size={14} /> Sent Back
      </span>
    );
  }
  if (decision === 'CONDITIONAL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <AlertCircle size={14} /> Officer Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
      <XCircle size={14} /> Rejected
    </span>
  );
}
