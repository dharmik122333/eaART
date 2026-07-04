const API_URL = import.meta.env.VITE_API_URL || '';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Internal refresh helper to prevent circular calls
let isRefreshing = false;
const tryTokenRefresh = async () => {
  if (isRefreshing) return false;
  isRefreshing = true;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    isRefreshing = false;
    return false;
  }
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('token', data.token);
      isRefreshing = false;
      return true;
    }
  } catch (err) {
    console.error('Failed to rotate session token:', err.message);
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  isRefreshing = false;
  return false;
};

const request = async (endpoint, options, isMultipart = false) => {
  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: getHeaders(isMultipart)
  });
  
  // If unauthorized, attempt transparent refresh once
  if (res.status === 401 && !endpoint.includes('/api/auth/refresh')) {
    const refreshed = await tryTokenRefresh();
    if (refreshed) {
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: getHeaders(isMultipart)
      });
    } else {
      // Trigger full page logout redirect if session is dead
      window.dispatchEvent(new Event('auth-logout'));
    }
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

export const api = {
  get: async (endpoint) => {
    return request(endpoint, { method: 'GET' });
  },

  post: async (endpoint, body, isMultipart = false) => {
    return request(endpoint, {
      method: 'POST',
      body: isMultipart ? body : JSON.stringify(body)
    }, isMultipart);
  },

  put: async (endpoint, body, isMultipart = false) => {
    return request(endpoint, {
      method: 'PUT',
      body: isMultipart ? body : JSON.stringify(body)
    }, isMultipart);
  },

  delete: async (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }
};
