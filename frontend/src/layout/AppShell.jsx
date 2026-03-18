import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard',    icon: '▦',  key: 'dashboard'    },
  { path: '/clients',      icon: '◎',  key: 'clients'      },
  { path: '/appointments', icon: '◷',  key: 'appointments' },
  { path: '/payments',     icon: '◈',  key: 'payments'     },
  { path: '/ai-assistant', icon: '✦',  key: 'aiAssistant'  },
];

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">✦</div>
            <span className="brand-name">{t.appName}</span>
          </div>
          <div className="brand-tagline">{t.tagline}</div>
        </div>

        <div className="nav-section">
          <span className="nav-label">{t.navMain}</span>
          <nav className="nav-links">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {t[item.key]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user.name || 'User'}</div>
              <div className="user-email">{user.email || ''}</div>
            </div>
          </div>

          <div className="sidebar-actions">
            <LanguageSwitcher />
            <button
              className="theme-toggle"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              title="Toggle theme"
            >
              {theme === 'light' ? '◑' : '○'}
            </button>
          </div>

          <button className="logout-btn" onClick={logout}>
            ⇥ {t.logout}
          </button>
        </div>
      </aside>

      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}
