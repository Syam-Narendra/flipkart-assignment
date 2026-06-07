import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import type { TokenResponse } from '../types';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return setError('Enter username and password');
    setLoading(true);
    setError('');
    try {
      const res = await api.post<TokenResponse>('/auth/login', { username, password });
      login(res.user, res.access_token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon-lg">🔗</div>
          <h1>VerifyChain</h1>
          <p>Flipkart Supply Chain Verification System</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-demo-info">
          <p className="hint">
            Admin: <code>admin / admin123</code>&nbsp;·&nbsp;Operator:{' '}
            <code>operator / op123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
