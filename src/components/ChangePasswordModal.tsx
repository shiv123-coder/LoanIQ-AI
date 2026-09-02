import React, { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { API_BASE } from '../config/api';

interface ChangePasswordModalProps {
  onClose: () => void;
  role: 'user' | 'admin';
}

export default function ChangePasswordModal({ onClose, role }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [saving, setSaving] = useState(false);

  const endpoint = role === 'admin' ? `${API_BASE}/api/admin/password` : `${API_BASE}/api/user/password`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!oldPassword) {
      toast.error('Current password is required.');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    
    if (newPassword === oldPassword) {
      toast.error('New password cannot be the same as the current password.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to change your password?')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword })
      }, role);
      
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated successfully.');
        onClose();
      } else {
        toast.error(data.error || 'Failed to update password.');
      }
    } catch (err) {
      toast.error('Network error occurred.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-bold">Change Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Current Password</label>
            <div className="relative mt-1">
              <input 
                type={showOld ? 'text' : 'password'} 
                value={oldPassword} 
                onChange={e => setOldPassword(e.target.value)} 
                className="w-full bg-secondary border border-border focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition-colors" 
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
            <div className="relative mt-1">
              <input 
                type={showNew ? 'text' : 'password'} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full bg-secondary border border-border focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition-colors" 
                placeholder="Minimum 6 characters"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Confirm New Password</label>
            <div className="relative mt-1">
              <input 
                type={showConfirm ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full bg-secondary border border-border focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition-colors" 
                placeholder="Re-enter new password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center justify-center min-w-[140px] transition-all shadow-md"
            >
              {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
