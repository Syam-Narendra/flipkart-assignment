import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

export type PageName = 'dashboard' | 'upload' | 'verify' | 'reports' | 'users' | 'products';

interface Props {
  page: PageName;
  setPage: (p: PageName) => void;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ id: PageName; label: string; icon: string; adminOnly?: boolean }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'verify', label: 'Verify Product', icon: '✓' },
  { id: 'upload', label: 'Upload CSV', icon: '↑', adminOnly: true },
  { id: 'products', label: 'Products', icon: '📦', adminOnly: true },
  { id: 'reports', label: 'Reports', icon: '📊', adminOnly: true },
  { id: 'users', label: 'Users', icon: '👥', adminOnly: true },
];

export default function Layout({ page, setPage, children }: Props) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🔗</span>
          <span className="brand-name">VerifyChain</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              key={item.id}
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
