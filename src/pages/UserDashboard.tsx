import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { useLoan } from '../context/LoanContext';
import { useLang } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { DashboardStatsSkeleton, LoanHistorySkeleton } from '../components/SkeletonLoaders';
import {
  User, LogOut, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Banknote, ChevronRight, FileText, LayoutDashboard, RefreshCw, Download, 
  ArrowRight, ShieldCheck, PhoneCall, Headphones, FileSignature, Settings
} from 'lucide-react';
import { AdminTableSkeleton } from '../components/SkeletonLoaders';
import ChangePasswordModal from '../components/ChangePasswordModal';
import NotificationBell from '../components/NotificationBell';
import { generateSanctionLetter } from '../lib/pdfGenerator';
import { API_BASE } from '../config/api';
import { toast } from 'sonner';

interface LoanRecord {
  id: string;
  createdAt: string;
  creditScore: number;
  decision: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'DISBURSED' | 'SENT_BACK';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  customerDetails?: { name: string; location: any };
  financialDetails?: { income: number; jobType: string; loanPurpose: string; requestedAmount: number };
  offer?: { offeredAmount: number; interestRate: number; tenure: number; emi: number } | null;
  verification?: { liveness: boolean; panVerified: boolean };
  rejectionReasons?: any[];
}

const riskColors = { LOW: 'text-emerald-400', MEDIUM: 'text-amber-400', HIGH: 'text-red-400' };

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useUserAuth();
  const { setState } = useLoan();
  const { t } = useLang();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const toastId = toast.loading(t('dashboard:uploadingDocs', 'Uploading documents...'));
    
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(file => {
        formData.append('documents', file);
      });
      
      const res = await fetchWithAuth(`${API_BASE}/api/user/upload-docs`, {
        method: 'POST',
        body: formData,
      }, 'user');
      
      const data = await res.json();
      if (data.success) {
        toast.success(t('dashboard:docsUploaded', 'Documents uploaded successfully'), { id: toastId });
      } else {
        toast.error(data.error || 'Upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error during upload', { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  }

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/user/auth');
      } else if (user.isApplicant) {
        navigate('/user/auth?mode=upgrade');
      }
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchLoans();
  }, [user]);

  async function fetchLoans() {
    setFetching(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/user/my-loans/${user?.userId}`, {}, 'user');
      const data = await res.json();
      if (data.success) setLoans(data.loans || []);
    } catch {
      setLoans([]);
    } finally {
      setFetching(false);
    }
  }

  function handleAction(loan: any, path: string) {
    setState(prev => ({
      ...prev,
      result: {
        success: true,
        creditScore: loan.creditScore,
        riskLevel: loan.riskLevel,
        decision: loan.decision,
        offer: loan.offer || null,
        report: loan,
        docId: loan.id,
      }
    }));
    navigate(path);
  }

  if (isLoading) return <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6"><DashboardStatsSkeleton /></div>;

  const stats = {
    total: loans.length,
    approved: loans.filter(l => l.decision === 'APPROVED' || l.decision === 'DISBURSED').length,
    conditional: loans.filter(l => l.decision === 'CONDITIONAL' || l.decision === 'SENT_BACK').length,
    rejected: loans.filter(l => l.decision === 'REJECTED').length,
  };

  const filteredLoans = filter ? loans.filter(l => {
    if (filter === 'APPROVED') return l.decision === 'APPROVED' || l.decision === 'DISBURSED';
    if (filter === 'CONDITIONAL') return l.decision === 'CONDITIONAL' || l.decision === 'SENT_BACK';
    return l.decision === filter;
  }) : loans;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block tracking-tight">{t('dashboard:portalName', 'LoanIQ Portal')}</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <LanguageSwitcher compact />
            {user?.userId && <NotificationBell role="user" userId={user.userId} />}
            <div className="w-px h-6 bg-border mx-1" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                {user?.name?.substring(0, 2) || 'US'}
              </div>
              <span className="text-sm font-medium hidden md:block">{user?.name}</span>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors ml-1"
              title="My Profile"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors ml-1"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Glassmorphic Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-white/10 dark:border-white/5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full mix-blend-screen" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full mix-blend-screen" />
              
              <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                    {t('dashboard:welcomeBack', 'Welcome back')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">{user?.name?.split(' ')[0]}</span>
                  </h1>
                  <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                    {t('dashboard:trackDesc', 'Track your loan applications, manage your documents, and view your customized financial offers in one secure place.')}
                  </p>
                </div>
                <button
                  onClick={fetchLoans}
                  disabled={fetching}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background border border-border rounded-xl text-sm font-medium transition-all shadow-sm backdrop-blur-sm"
                >
                  <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
                  {t('dashboard:refresh', 'Refresh Data')}
                </button>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              {[
                { label: t('dashboard:totalApps', 'Total Apps'), value: stats.total, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', icon: <FileText size={18} />, key: null },
                { label: t('dashboard:approvedStats', 'Approved'), value: stats.approved, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle size={18} />, key: 'APPROVED' },
                { label: t('dashboard:pendingStats', 'Pending'), value: stats.conditional, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: <AlertCircle size={18} />, key: 'CONDITIONAL' },
                { label: t('dashboard:rejectedStats', 'Rejected'), value: stats.rejected, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle size={18} />, key: 'REJECTED' },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => setFilter(s.key)}
                  className={`group relative overflow-hidden bg-card border rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                    filter === s.key ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 transition-transform group-hover:scale-110 ${s.bg}`} />
                  <div className={`flex items-center gap-2 ${s.color} mb-3`}>
                    <div className={`p-1.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                    <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className={`text-4xl font-extrabold ${s.color}`}>{s.value}</div>
                </button>
              ))}
            </div>

            {/* Application List */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  {t('dashboard:appHistory', 'Application History')}
                </h2>
                {filter && (
                  <button onClick={() => setFilter(null)} className="text-xs font-medium text-blue-500 hover:underline">
                    {t('dashboard:clearFilter', 'Clear Filter')}
                  </button>
                )}
              </div>

              {fetching ? (
                <div className="space-y-4"><LoanHistorySkeleton count={3} /></div>
              ) : loans.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <TrendingUp size={36} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t('dashboard:noApps', 'No applications yet')}</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                      {t('dashboard:noAppsDesc', 'You haven\'t started your financial journey with us. Apply now and get an instant AI-powered decision.')}
                    </p>
                    <button
                      onClick={() => navigate('/apply')}
                      className="group flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:scale-105 transition-all shadow-lg"
                    >
                      {t('dashboard:startApp', 'Start Application')}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-secondary/20">
                  <p className="text-muted-foreground">{t('dashboard:noFilterApps', 'No applications match the current filter.')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLoans.map((loan) => (
                    <LoanCard 
                      key={loan.id} 
                      loan={loan} 
                      isExpanded={expanded === loan.id} 
                      onToggle={() => setExpanded(expanded === loan.id ? null : loan.id)}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </div>
            
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">{t('dashboard:quickActions', 'Quick Actions')}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/apply?new=true')}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl"><FileSignature size={18} /></div>
                    <span className="font-semibold text-sm">{t('dashboard:newApp', 'New Application')}</span>
                  </div>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <label className={`w-full group flex items-center justify-between p-4 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-xl shadow-sm text-foreground">
                      {uploading ? <RefreshCw size={18} className="animate-spin text-blue-500" /> : <UploadIcon size={18} />}
                    </div>
                    <span className="font-medium text-sm text-foreground">
                      {uploading ? t('dashboard:uploading', 'Uploading...') : t('dashboard:uploadDocs', 'Upload Documents')}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      disabled={uploading}
                      onChange={handleFileUpload} 
                    />
                  </div>
                  {!uploading && <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />}
                </label>
              </div>
            </div>

            {/* Support / Help */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 relative z-10">{t('dashboard:needHelp', 'Need Help?')}</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{t('dashboard:contactSupport', 'Contact Support')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard:supportDesc', 'Our team is available 24/7 to assist with your loan process.')}</p>
                  </div>
                </div>
                <a href="tel:9370717823" className="w-full py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <PhoneCall size={14} /> 1-800-LOANIQ
                </a>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground">
              <ShieldCheck size={24} className="text-blue-500 shrink-0" />
              <p>{t('dashboard:securityNote', 'Your data is secured with enterprise-grade AES-256 encryption and strict access controls.')}</p>
            </div>

          </div>
        </div>
      </main>
      
      {showProfileModal && <UserProfileModal onClose={() => setShowProfileModal(false)} userId={user?.userId} />}
    </div>
  );
}

function UserProfileModal({ onClose, userId }: { onClose: () => void, userId?: string }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', dob: '', address: '', occupation: '', documents: [] as string[] });
  const [originalProfile, setOriginalProfile] = useState({ name: '', email: '', phone: '', dob: '', address: '', occupation: '', documents: [] as string[] });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/user/profile`, {}, 'user');
        const data = await res.json();
        if (data.success) {
          const loadedProfile = {
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            dob: data.data.dob || '',
            address: data.data.address || '',
            occupation: data.data.occupation || '',
            documents: data.data.documents || []
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
      const res = await fetchWithAuth(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          dob: profile.dob,
          address: profile.address,
          occupation: profile.occupation
        })
      }, 'user');
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully.');
        setOriginalProfile(profile);
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update');
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
          <h2 className="text-xl font-bold">{t('dashboard:myProfile', 'My Profile')}</h2>
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
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('fullName')}</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('email')}</label>
              <input type="email" value={profile.email} disabled className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm opacity-70 cursor-not-allowed outline-none" />
              {isEditing && <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t('auth:phone', 'Phone')}</label>
                <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t('auth:dob', 'Date of Birth')}</label>
                <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('auth:address', 'Address')}</label>
              <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('auth:occupation', 'Occupation')}</label>
              <input type="text" value={profile.occupation} onChange={e => setProfile({...profile, occupation: e.target.value})} disabled={!isEditing} className={`w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none ${!isEditing ? 'opacity-80 cursor-not-allowed' : 'focus:border-primary'}`} />
            </div>

            {profile.documents && profile.documents.length > 0 && !isEditing && (
              <div className="pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">{t('dashboard:myDocuments', 'My Uploaded Documents')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {profile.documents.map((docUrl, idx) => (
                    <a key={idx} href={docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-secondary/50 border border-border rounded-lg hover:bg-secondary transition-colors group">
                      <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md group-hover:scale-110 transition-transform"><FileSignature size={14} /></div>
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
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} role="user" />}
    </div>
  );
}

// -----------------------------------------------------
// Helper Components
// -----------------------------------------------------

function UploadIcon(props: any) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}

function LoanCard({ loan, isExpanded, onToggle, onAction }: { loan: any, isExpanded: boolean, onToggle: () => void, onAction: (l:any, p:string) => void }) {
  const { t } = useLang();
  const dateStr = loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  
  // Determine global status color and label
  let statusColor = 'text-amber-500';
  let statusBg = 'bg-amber-500/10 border-amber-500/20';
  let statusLabel = t('dashboard:inProgress', 'In Progress');
  
  if (loan.decision === 'APPROVED') { statusColor = 'text-emerald-500'; statusBg = 'bg-emerald-500/10 border-emerald-500/20'; statusLabel = t('dashboard:approvedStats', 'Approved'); }
  if (loan.decision === 'DISBURSED') { statusColor = 'text-blue-500'; statusBg = 'bg-blue-500/10 border-blue-500/20'; statusLabel = t('dashboard:disbursed', 'Disbursed'); }
  if (loan.decision === 'REJECTED') { statusColor = 'text-red-500'; statusBg = 'bg-red-500/10 border-red-500/20'; statusLabel = t('dashboard:rejectedStats', 'Rejected'); }
  if (loan.decision === 'SENT_BACK') { statusColor = 'text-orange-500'; statusBg = 'bg-orange-500/10 border-orange-500/20'; statusLabel = t('dashboard:officerReview', 'Officer Review'); }

  return (
    <div className={`bg-card border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-border shadow-xl rounded-3xl' : 'border-border hover:border-border/80 shadow-sm hover:shadow-md rounded-2xl'}`}>
      
      {/* Header (Always Visible) */}
      <div 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
            <Banknote size={20} className="text-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              {loan.financialDetails?.loanPurpose || t('dashboard:personalLoan', 'Personal Loan')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard:applied', 'Applied:')} {dateStr}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="font-bold text-foreground">₹{(loan.financialDetails?.requestedAmount || loan.offer?.offeredAmount || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">{t('dashboard:amount', 'Amount')}</p>
          </div>
          <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${statusBg} ${statusColor}`}>
            {statusLabel}
          </div>
          <ChevronRight size={18} className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 border-t border-border bg-secondary/10 space-y-6">
          
          {/* Custom Stepper */}
          <LoanStepper loan={loan} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCell label={t('dashboard:creditScore', 'Credit Score')} value={String(loan.creditScore)} sub="/900" />
            <InfoCell label={t('dashboard:riskLevel', 'Risk Level')} value={loan.riskLevel} className={riskColors[loan.riskLevel as keyof typeof riskColors]} />
            <InfoCell label={t('dashboard:monthlyIncome', 'Monthly Income')} value={`₹${(loan.financialDetails?.income || 0).toLocaleString('en-IN')}`} />
            <InfoCell label={t('dashboard:employment', 'Employment')} value={loan.financialDetails?.jobType || 'N/A'} />
          </div>

          {loan.offer && (
            <div className="bg-card border border-emerald-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider mb-4 relative z-10">
                <CheckCircle size={16} /> {t('dashboard:finalOffer', 'Final Approved Offer')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                <InfoCell label={t('dashboard:approvedAmount', 'Approved Amount')} value={`₹${loan.offer.offeredAmount.toLocaleString('en-IN')}`} className="text-emerald-500 text-lg" />
                <InfoCell label={t('dashboard:interestRate', 'Interest Rate')} value={`${loan.offer.interestRate}%`} sub={t('dashboard:pa', ' p.a.')} />
                <InfoCell label={t('dashboard:monthlyEmi', 'Monthly EMI')} value={`₹${loan.offer.emi.toLocaleString('en-IN')}`} />
                <InfoCell label={t('dashboard:tenure', 'Tenure')} value={`${loan.offer.tenure}${t('dashboard:mo', ' mo')}`} />
              </div>
            </div>
          )}

          {loan.decision === 'REJECTED' && loan.rejectionReasons && loan.rejectionReasons.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-2">
                <XCircle size={16} /> {t('dashboard:rejectionReasons', 'Rejection Reasons')}
              </div>
              {loan.rejectionReasons.map((reason: any, i: number) => (
                <div key={i} className="flex gap-3 items-start bg-background p-3 rounded-xl border border-border shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <div>
                    <h4 className="text-foreground font-semibold text-sm">{reason.title}</h4>
                    <p className="text-muted-foreground text-xs mt-1">{reason.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onAction(loan, '/report')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border text-foreground rounded-xl hover:bg-secondary transition-all text-sm font-semibold shadow-sm"
            >
              <FileText size={16} /> {t('dashboard:viewReport', 'View Full Report')}
            </button>
            
            {(loan.decision === 'APPROVED' || loan.decision === 'DISBURSED') && (
              <button
                onClick={(e) => { e.stopPropagation(); generateSanctionLetter(loan); }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
              >
                <Download size={16} /> {t('dashboard:downloadSanction', 'Download Sanction Letter')}
              </button>
            )}

            {loan.offer && loan.decision === 'APPROVED' && (
              <button
                onClick={() => onAction(loan, '/disbursement')}
                className="sm:ml-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-emerald-500/25"
              >
                {t('dashboard:acceptOffer', 'Accept Offer')} <ArrowRight size={16} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------
// Progress Stepper Component
// -----------------------------------------------------

function LoanStepper({ loan }: { loan: any }) {
  const { t } = useLang();
  // Determine steps and current active step
  const steps = [
    { id: 1, label: t('dashboard:stepSubmitted', 'Submitted'), status: 'complete' }, // Always complete if it exists
    { id: 2, label: t('dashboard:stepVerification', 'Verification'), status: (loan.verification?.liveness && loan.verification?.panVerified) ? 'complete' : loan.decision === 'REJECTED' ? 'error' : 'current' },
    { id: 3, label: t('dashboard:stepUnderwriting', 'Underwriting'), status: ['APPROVED', 'DISBURSED', 'REJECTED'].includes(loan.decision) ? 'complete' : loan.decision === 'SENT_BACK' ? 'current' : loan.decision === 'CONDITIONAL' ? 'current' : 'upcoming' },
    { id: 4, label: t('dashboard:stepFinal', 'Final Decision'), status: loan.decision === 'DISBURSED' ? 'complete' : loan.decision === 'APPROVED' ? 'complete' : loan.decision === 'REJECTED' ? 'error' : 'upcoming' },
    { id: 5, label: t('dashboard:stepDisbursed', 'Disbursed'), status: loan.decision === 'DISBURSED' ? 'complete' : 'upcoming' },
  ];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full z-0" />
        
        {steps.map((step, idx) => {
          // Calculate progress bar fill
          let barFill = 'w-0';
          if (step.status === 'complete') barFill = 'w-full';
          if (step.status === 'current') barFill = 'w-1/2';
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              {idx > 0 && (
                 <div className={`absolute right-1/2 top-4 -translate-y-1/2 h-1 bg-blue-500 transition-all duration-1000 ease-out z-[-1] ${step.status === 'complete' ? 'w-full' : step.status === 'current' ? 'w-1/2' : step.status === 'error' ? 'w-full !bg-red-500' : 'w-0'}`} style={{ right: '50%' }} />
              )}
              
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 bg-background transition-colors duration-500 ${
                step.status === 'complete' ? 'border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                step.status === 'current' ? 'border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                step.status === 'error' ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                'border-border text-muted-foreground'
              }`}>
                {step.status === 'complete' ? <CheckCircle size={14} /> : 
                 step.status === 'error' ? <XCircle size={14} /> : 
                 step.status === 'current' ? <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> : 
                 <span className="text-[10px] font-bold">{step.id}</span>}
              </div>
              
              <span className={`text-[10px] sm:text-xs font-medium text-center whitespace-nowrap absolute top-10 ${
                step.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-8" /> {/* Spacer for absolute labels */}
    </div>
  );
}

function InfoCell({ label, value, sub = '', className = '' }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">{label}</div>
      <div className={`font-bold text-sm text-foreground ${className}`}>
        {value}<span className="text-muted-foreground font-normal text-xs">{sub}</span>
      </div>
    </div>
  );
}
