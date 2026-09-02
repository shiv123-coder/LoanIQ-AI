import { fetchWithAuth } from './fetchWithAuth';

export interface AppNotification {
  id: string;
  recipientRole: 'user' | 'loan_officer' | 'admin';
  recipientId?: string | null;
  title: string;
  message: string;
  type: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  isRead: boolean;
  createdAt: string;
  timestamp: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchNotifications(role: 'admin' | 'user' = 'admin'): Promise<AppNotification[]> {
  try {
    const res = await fetchWithAuth('/api/notifications', {}, role);
    if (res && res.ok) {
      const json = await res.json();
      if (json && json.success) {
        return json.data;
      }
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

export async function addNotification(title: string, message: string, type: string = 'info', role: 'admin' | 'user' = 'admin') {
  try {
    await fetchWithAuth('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, message, type }),
    });
  } catch (error) {
    console.error('Failed to add notification:', error);
  }
}

export function subscribeToNotifications(
  role: 'user' | 'loan_officer' | 'admin', 
  userId: string | null, 
  callback: (notifications: AppNotification[]) => void,
  onError?: (err: any) => void
): () => void {
  
  let token = null;
  if (role === 'user') {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      token = session?.token;
    } catch(e) {}
  } else {
    token = localStorage.getItem('admin_token');
  }

  if (!token) {
    if (onError) onError(new Error('No token found for notifications'));
    return () => {};
  }

  const eventSource = new EventSource(`${API_BASE}/api/notifications/stream?token=${token}`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'NOTIFICATIONS_UPDATE') {
        callback(data.notifications);
      }
    } catch (e) {
      console.error('Error parsing notification event', e);
    }
  };

  eventSource.onerror = (err) => {
    console.error('Notification EventSource error:', err);
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

export async function markNotificationAsRead(id: string, role: 'admin' | 'user' = 'admin') {
  try {
    await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PATCH' }, role);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(role: 'admin' | 'user' = 'admin') {
  try {
    await fetchWithAuth('/api/notifications/read-all', { method: 'PATCH' }, role);
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
}

export async function deleteNotification(id: string, role: 'admin' | 'user' = 'admin') {
  try {
    await fetchWithAuth(`/api/notifications/${id}`, { method: 'DELETE' }, role);
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
}

export async function clearAllNotifications(role: 'admin' | 'user' = 'admin') {
  try {
    await fetchWithAuth('/api/notifications', { method: 'DELETE' }, role);
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}
