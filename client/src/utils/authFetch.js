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
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await parseJsonResponse(res);

  if (res.status === 401) {
    localStorage.removeItem('jewel_user');
    localStorage.removeItem('jewel_is_admin');
    window.location.href = '/login';
    throw new Error(data.message || 'Session expired');
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }

  return data;
}
