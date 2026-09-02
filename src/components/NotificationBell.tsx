import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, Info, AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { AppNotification, subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../lib/notificationService';
import { useLang } from '../context/LanguageContext';

interface NotificationBellProps {
  role: 'user' | 'loan_officer' | 'admin';
  userId?: string | null;
}

export default function NotificationBell({ role, userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const { t } = useLang();

  useEffect(() => {
    if (role === 'user' && !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToNotifications(
      role, 
      userId || null, 
      (newNotifs) => {
        setNotifications(newNotifs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(t('common:notifError', 'Unable to load notifications. Please check your connection.'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [role, userId, t]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 384; // w-96 = 24rem = 384px
      
      // Right align with the button by default
      let left = rect.right - dropdownWidth;
      
      // Ensure it doesn't overflow left edge of screen
      if (left < 16) left = 16;
      
      setDropdownStyle({
        top: rect.bottom + 8 + window.scrollY,
        left: left + window.scrollX,
        width: Math.min(dropdownWidth, window.innerWidth - 32)
      });
    }
  };

  useEffect(() => {
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, { passive: true });
    window.addEventListener('resize', updateDropdownPosition, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const fetchRole = (role === 'admin' || role === 'loan_officer') ? 'admin' : 'user';

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markNotificationAsRead(id, fetchRole);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllNotificationsAsRead(fetchRole);
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications([]);
    await clearAllNotifications(fetchRole);
  };

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={dropdownStyle}
          className="absolute z-notification bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-premium overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-md">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Bell size={14} className="text-primary" /> {t('common:notifications', 'Notifications')}
            </h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{unreadCount} new</span>
              )}
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary">
                <X size={14} />
              </button>
            </div>
          </div>
          
          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border text-xs font-medium">
              <button 
                onClick={handleMarkAllAsRead} 
                disabled={unreadCount === 0}
                className="text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark all read
              </button>
              <button 
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          )}
          
          {/* Notification List */}
          <div className="max-h-[350px] overflow-y-auto">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-sm font-medium">{t('common:loadingNotifs', 'Loading notifications...')}</span>
              </div>
            ) : error ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertCircle size={24} />
                </div>
                <p className="text-sm font-medium text-foreground">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <Bell size={24} />
                </div>
                <h4 className="text-sm font-bold text-foreground">{t('common:noNotifs', 'No notifications yet')}</h4>
                <p className="text-xs text-muted-foreground">{t('common:noNotifsDesc', 'When there are updates about your application, they\'ll appear here.')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 flex gap-3 transition-colors ${!notif.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/50'}`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notif.isRead ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      <Info size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                        {notif.title}
                      </p>
                      <p className={`text-xs mt-1 break-words line-clamp-3 ${!notif.isRead ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="flex-shrink-0 self-start p-1.5 text-primary hover:bg-primary hover:text-white rounded-full transition-all border border-transparent hover:border-primary shadow-sm"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 8 && (
            <div className="sticky bottom-0 z-10 p-3 bg-card/95 backdrop-blur-md border-t border-border text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-primary hover:underline transition-all"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
