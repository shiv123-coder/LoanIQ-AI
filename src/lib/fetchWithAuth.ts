export async function fetchWithAuth(url: string, options: RequestInit = {}, role: 'admin' | 'user' = 'admin') {
  const headers = new Headers(options.headers || {});
  let token = null;
  
  if (role === 'admin') {
    token = localStorage.getItem('admin_token');
  } else {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      token = session?.token;
    } catch(e) {}
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Automatically prepend API_BASE for relative API routes
  let finalUrl = url;
  if (url.startsWith('/api')) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    finalUrl = `${API_BASE}${url}`;
  }

  const res = await fetch(finalUrl, { ...options, headers });
  
  if (res.status === 401) {
    if (role === 'admin') localStorage.removeItem('admin_token');
    else localStorage.removeItem('user_session');
    window.location.href = role === 'admin' ? '/admin/auth' : '/user/auth';
  }
  
  return res;
}
