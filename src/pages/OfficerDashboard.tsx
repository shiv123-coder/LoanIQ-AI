import React, { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ChevronDown, CheckCircle, AlertCircle, XCircle,
  TrendingUp, Eye, MapPin, LogOut, ThumbsUp, ThumbsDown, 
  FileText, Download, Briefcase, Camera, ShieldCheck, Edit, Settings, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import CountUp from 'react-countup';
import { AdminTableSkeleton } from '../components/SkeletonLoaders';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { API_BASE } from '../config/api';
import { generateApplicationReviewPDF, generateKYCVerificationPDF } from '../lib/pdfGenerator';
import { addNotification } from '../lib/notificationService';

export default function OfficerDashboard() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [editingAppUserId, setEditingAppUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const navigate = useNavigate();

  async function handleUpdateDecision(app: any, decision: 'APPROVED' | 'REJECTED') {
    const label = decision === 'APPROVED' ? 'approve' : 'reject';
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
        toast.success(`Application ${decision === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
        
        // Notify the applicant
        // Notification is triggered by backend 
        
        // Notify the admin if approved
        if (decision === 'APPROVED') {
        // Admin notification triggered by backend if needed
        }
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
  }, []);

  const stats = {
    pending: apps.filter((a: any) => a.decision === 'CONDITIONAL').length,
    kycPending: apps.filter((a: any) => a.verification?.panVerified === false).length,
    approved: apps.filter((a: any) => a.decision === 'APPROVED').length,
    rejected: apps.filter((a: any) => a.decision === 'REJECTED' || a.decision === 'SENT_BACK').length,
  };

  const filteredApps = filter ? apps.filter((a: any) => {
    if (filter === 'CONDITIONAL') return a.decision === 'CONDITIONAL';
    if (filter === 'KYC_PENDING') return a.verification?.panVerified === false;
    if (filter === 'APPROVED') return a.decision === 'APPROVED';
    if (filter === 'REJECTED') return a.decision === 'REJECTED' || a.decision === 'SENT_BACK';
    return true;
  }) : apps;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block tracking-tight">LoanIQ <span className="text-muted-foreground font-medium">Officer Portal</span></span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <NotificationBell role="loan_officer" />
            
            <div className="w-px h-6 bg-border mx-1" />
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-colors ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors ml-1"
              title="My Profile"
            >
              <Settings size={18} />
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
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border border-white/10 dark:border-white/5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full mix-blend-screen" />
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                Loan Officer <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Workspace</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
                Review and underwrite loan applications. Evaluate risk, verify KYC documents, and send verified applications to administration for final sanctioning.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3 animate-in fade-in">
            <XCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Overview Stats */}
        {!loading && apps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {[
              { label: 'Pending Review', value: stats.pending, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: <Briefcase size={18} />, key: 'CONDITIONAL' },
              { label: 'KYC Pending', value: stats.kycPending, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', icon: <Camera size={18} />, key: 'KYC_PENDING' },
              { label: 'Approved Today', value: stats.approved, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle size={18} />, key: 'APPROVED' },
              { label: 'Returned / Rejected', value: stats.rejected, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle size={18} />, key: 'REJECTED' },
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
                  <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                </div>
                <div className={`text-4xl font-extrabold ${s.color}`}>
                  <CountUp end={s.value} duration={2.5} preserveValue />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Application List */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Application Queue
            </h2>
            {filter && (
              <button onClick={() => setFilter(null)} className="text-xs font-bold uppercase tracking-wider text-blue-500 hover:underline">
                Clear Filter
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Applicant</th>
                  <th className="px-6 py-4 font-bold">Loan Details</th>
                  <th className="px-6 py-4 font-bold">Credit / Risk</th>
                  <th className="px-6 py-4 font-bold">Verification</th>
                  <th className="px-6 py-4 font-bold">Decision</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <AdminTableSkeleton rows={5} />
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 shadow-inner">
                          <CheckCircle size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
                        <p className="text-muted-foreground text-sm mt-1">No applications matching the current filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <Fragment key={app.id}>
                      <tr className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-foreground">{app.customerDetails?.name || 'Unknown Applicant'}</div>
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
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ChevronDown size={20} className={`text-muted-foreground transform transition-transform duration-300 ${expandedId === app.id ? 'rotate-180' : ''}`} />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {expandedId === app.id && (
                        <tr className="bg-secondary/10 border-t border-border">
                          <td colSpan={6} className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 relative z-10">
                                  <TrendingUp size={16} className="text-blue-500" /> AI Explanation
                                </h4>
                                <p className="text-sm text-foreground leading-relaxed bg-background p-4 rounded-xl border border-border shadow-inner font-medium">
                                  {app.explanation}
                                </p>
                              </div>

                              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-bl-full" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 relative z-10">
                                  <Eye size={16} className="text-violet-500" /> Score Adjustments
                                </h4>
                                <div className="text-xs text-foreground space-y-3 relative z-10">
                                  {app.adjustments?.map((adj: any, i: number) => {
                                    const isPos = adj.delta >= 0;
                                    // Scale delta for visual width (max 100%)
                                    const magnitude = Math.min(Math.abs(adj.delta), 100);
                                    return (
                                      <div key={i} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                          <span>{adj.factor}</span>
                                          <span className={isPos ? 'text-emerald-500' : 'text-red-500'}>
                                            {isPos ? '+' : ''}{adj.delta}
                                          </span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden flex relative">
                                          {/* Center line axis */}
                                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/50 z-10" />
                                          <div className="w-1/2 flex justify-end">
                                             {!isPos && <div className="h-full bg-gradient-to-l from-red-500/80 to-red-500 rounded-l-full transition-all duration-1000" style={{ width: `${magnitude}%` }} />}
                                          </div>
                                          <div className="w-1/2 flex justify-start">
                                             {isPos && <div className="h-full bg-gradient-to-r from-emerald-500/80 to-emerald-500 rounded-r-full transition-all duration-1000" style={{ width: `${magnitude}%` }} />}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-background border border-border rounded-2xl shadow-sm">
                              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <button 
                                  onClick={() => generateApplicationReviewPDF(app)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-blue-500/20"
                                >
                                  <FileText size={16} /> Review PDF
                                </button>
                                <button 
                                  onClick={() => generateKYCVerificationPDF(app)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-violet-500/20"
                                >
                                  <Download size={16} /> KYC Report
                                </button>
                                {app.userId && (
                                  <button 
                                    onClick={() => setEditingAppUserId(app.userId)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-amber-500/20"
                                  >
                                    <Edit size={16} /> Edit Customer
                                  </button>
                                )}
                              </div>
                              
                              {app.decision === 'CONDITIONAL' && (
                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                  <button
                                    disabled={isProcessing}
                                    onClick={(e) => { e.stopPropagation(); handleUpdateDecision(app, 'REJECTED'); }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/30 rounded-xl transition-all shadow-sm"
                                  >
                                    <ThumbsDown size={16} /> Reject
                                  </button>
                                  <button
                                    disabled={isProcessing}
                                    onClick={(e) => { e.stopPropagation(); handleUpdateDecision(app, 'APPROVED'); }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 rounded-xl transition-all shadow-sm"
                                  >
                                    <ThumbsUp size={16} /> Approve
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
      </main>
      
      
      {editingAppUserId && <OfficerEditModal onClose={() => setEditingAppUserId(null)} userId={editingAppUserId} />}
      {showProfileModal && <StaffProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
}

function StaffProfileModal({ onClose }: { onClose: () => void }) {
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

function OfficerEditModal({ onClose, userId }: { onClose: () => void, userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '', dob: '', address: '', occupation: '', documents: [] as string[] });
  const [originalProfile, setOriginalProfile] = useState({ name: '', phone: '', dob: '', address: '', occupation: '', documents: [] as string[] });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/admin/users`, {}, 'admin');
        const data = await res.json();
        if (data.success) {
          const user = data.data.find((u: any) => u.id === userId);
          if (user) {
            const loadedProfile = {
              name: user.name || '',
              phone: user.phone || '',
              dob: user.dob || '',
              address: user.address || '',
              occupation: user.occupation || '',
              documents: user.documents || []
            };
            setProfile(loadedProfile);
            setOriginalProfile(loadedProfile);
          }
        }
      } catch (err) {
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      }, 'admin');
      const data = await res.json();
      if (data.success) {
        toast.success('Customer profile updated successfully.');
        setOriginalProfile(profile);
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update customer');
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
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Customer Info</h2>
          {!loading && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
              Edit Info
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">View or update customer details directly required for processing their loan application securely.</p>
        
        {loading ? (
          <div className="h-40 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
                <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Date of Birth</label>
                <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Address</label>
              <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Occupation</label>
              <input type="text" value={profile.occupation} onChange={e => setProfile({...profile, occupation: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>

            {profile.documents && profile.documents.length > 0 && !isEditing && (
              <div className="pt-2 border-t border-border mt-4">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Uploaded Documents</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {profile.documents.map((docUrl, idx) => (
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
        )}
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle size={14} /> Approved
      </span>
    );
  }
  if (decision === 'CONDITIONAL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
        <AlertCircle size={14} className="animate-pulse" /> Pending Review
      </span>
    );
  }
  if (decision === 'SENT_BACK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
        <AlertCircle size={14} /> Sent Back
      </span>
    );
  }
  if (decision === 'DISBURSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <CheckCircle size={14} /> Disbursed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
      <XCircle size={14} /> Rejected
    </span>
  );
}
