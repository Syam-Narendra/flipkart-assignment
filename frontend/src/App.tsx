import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Verify from './pages/Verify';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Products from './pages/Products';
import Layout, { type PageName } from './components/Layout';
import { AuthContext } from './hooks/useAuth';
import { api } from './utils/api';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageName>('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get<User>('/auth/me')
        .then((u) => setUser(u))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setPage('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <Login />
      </AuthContext.Provider>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard setPage={setPage} />;
      case 'verify':    return <Verify />;
      case 'upload':    return user.role === 'admin' ? <Upload /> : <Forbidden />;
      case 'reports':   return user.role === 'admin' ? <Reports /> : <Forbidden />;
      case 'users':     return user.role === 'admin' ? <Users /> : <Forbidden />;
      case 'products':  return user.role === 'admin' ? <Products /> : <Forbidden />;
      default:          return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Layout page={page} setPage={setPage}>
        {renderPage()}
      </Layout>
    </AuthContext.Provider>
  );
}

function Forbidden() {
  return (
    <div className="forbidden">
      <div className="forbidden-icon">🔒</div>
      <h2>Access Denied</h2>
      <p>This section requires Admin access.</p>
    </div>
  );
}
