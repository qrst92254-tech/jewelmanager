const API_URL = '';

function getHeaders() {
  const token = localStorage.getItem('jewel_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleAuthError(res) {
  if (res.status !== 401) return false;
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  localStorage.removeItem('jewel_token');
  localStorage.removeItem('jewel_user');
  if (data.code === 'SESSION_INVALIDATED') {
    alert('You have been logged out because your account was accessed on another device.');
  }
  window.location.href = '/login';
  return true;
}

export async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, { headers: getHeaders() });
  if (await handleAuthError(res)) return;
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (await handleAuthError(res)) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (await handleAuthError(res)) return;
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (await handleAuthError(res)) return;
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}
