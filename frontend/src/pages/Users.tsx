import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { User } from '../types';

interface CreateForm {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'operator';
}

const EMPTY_FORM: CreateForm = { name: '', username: '', password: '', role: 'operator' };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get<User[]>('/users');
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      return setCreateError('All fields are required');
    }
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      await api.post<User>('/users', form);
      setCreateSuccess(`User "${form.username}" created successfully.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchUsers();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>User Management</h2>
        <p>Create and manage operator and admin accounts for your warehouse team.</p>
      </div>

      {/* Create user */}
      <div className="card">
        <div className="card-row">
          <h3>Team Members</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setShowForm((v) => !v); setCreateError(''); setCreateSuccess(''); }}
          >
            {showForm ? '✕ Cancel' : '+ New User'}
          </button>
        </div>

        {createSuccess && <div className="alert alert-success">{createSuccess}</div>}

        {showForm && (
          <form onSubmit={createUser} className="create-user-form">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="u-name">Full Name</label>
                <input
                  id="u-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ravi Kumar"
                />
              </div>
              <div className="field">
                <label htmlFor="u-username">Username</label>
                <input
                  id="u-username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. ravi.kumar"
                  className="mono"
                />
              </div>
              <div className="field">
                <label htmlFor="u-password">Password</label>
                <input
                  id="u-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 4 characters"
                />
              </div>
              <div className="field">
                <label htmlFor="u-role">Role</label>
                <select
                  id="u-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'operator' })}
                >
                  <option value="operator">Operator — can verify products</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>
            </div>
            {createError && <div className="alert alert-error">{createError}</div>}
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </button>
          </form>
        )}
      </div>

      {/* Users table */}
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div className="empty-state"><p>Loading users…</p></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><p>No users found.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="muted">{i + 1}</td>
                    <td className="bold">{u.name}</td>
                    <td className="mono small">{u.username}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td className="muted small">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
