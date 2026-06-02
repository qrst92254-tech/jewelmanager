const API_URL = import.meta.env.VITE_API_URL || 'https://jewelmanager.onrender.com';

function getHeaders() {
  const token = localStorage.getItem('jewel_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, { headers: getHeaders() });
  if (res.status === 401) {
    localStorage.removeItem('jewel_token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    localStorage.removeItem('jewel_token');
    window.location.href = '/login';
    return;
  }
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
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}
