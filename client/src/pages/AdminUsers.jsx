import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { authFetch } from '../utils/authFetch';

export default function AdminUsers() {
  const isAdmin = useStore((state) => state.auth.isAdmin);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', shopName: '', phone: '', city: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await authFetch('/api/admin/users');
      setUsers(data.users);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setError('');
    setMessage('');
    try {
      await authFetch('/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          shopName: form.shopName,
          phone: form.phone,
          city: form.city,
        }),
      });
      setMessage(`User ${form.email} created successfully!`);
      setForm({ fullName: '', email: '', password: '', shopName: '', phone: '', city: '' });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Delete user ${userEmail}? This cannot be undone.`)) return;
    try {
      await authFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setMessage('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Access denied</h1>
        <p>Only the administrator can manage users.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>User Management</h1>
      <p>Create and manage shop owner accounts</p>

      {message && <div style={{ color: 'green', padding: '0.5rem', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', padding: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2>Create New User</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input placeholder="Full Name *" value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })} />
          <input placeholder="Email Address *" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password * (min 8 chars)" type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Shop Name" value={form.shopName}
            onChange={e => setForm({ ...form, shopName: e.target.value })} />
          <input placeholder="Phone Number * (10 digits)" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="City *" value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })} />
        </div>
        <button type="button" onClick={createUser}
          style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: '#b8960c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Create User
        </button>
      </div>

      <h2>All Users ({users.length})</h2>
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Shop / Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Trial Expires</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const now = new Date();
              const expiry = user.trialExpiresAt ? new Date(user.trialExpiresAt) : null;
              const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;
              
              // Status badge color
              let statusColor = '#16a34a';   // green = active
              let statusText = 'Active';
              let statusBg = '#f0fdf4';
              
              if (daysLeft !== null) {
                if (daysLeft < 0) {
                  statusColor = '#dc2626'; statusBg = '#fef2f2'; statusText = 'Expired';
                } else if (daysLeft <= 3) {
                  statusColor = '#d97706'; statusBg = '#fffbeb'; statusText = `${daysLeft}d left`;
                } else {
                  statusText = `${daysLeft}d left`;
                }
              }

              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee', background: daysLeft !== null && daysLeft < 0 ? '#fff5f5' : 'white' }}>
                  <td style={{ padding: '0.75rem' }}>{user.email}</td>
                  <td style={{ padding: '0.75rem', color: '#555' }}>{user.fullName || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                    {expiry ? expiry.toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: statusColor,
                      background: statusBg,
                      border: `1px solid ${statusColor}33`
                    }}>
                      {statusText}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button type="button" onClick={() => deleteUser(user.id, user.email)}
                      style={{ padding: '0.25rem 0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
