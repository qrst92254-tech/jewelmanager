export function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('jewel_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extra,
  };
}

export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers),
  });

  const data = await parseJsonResponse(res);

  if (res.status === 401) {
    localStorage.removeItem('jewel_token');
    localStorage.removeItem('jewel_user');
    localStorage.removeItem('jewel_is_admin');
    if (data.code === 'SESSION_INVALIDATED') {
      alert('You have been logged out because your account was accessed on another device.');
    }
    window.location.href = '/login';
    throw new Error(data.message || 'Session expired');
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed (${res.status})`);
  }

  return data;
}
