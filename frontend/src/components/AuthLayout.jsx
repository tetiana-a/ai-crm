import LanguageSwitcher from './LanguageSwitcher';

export default function AuthLayout({
  theme = 'dark',
  onToggleTheme,
  title,
  subtitle,
  footer,
  children,
  brandName = 'Nexara CRM',
}) {
  return (
    <div className={`auth-page ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="auth-card">
        <div className="auth-topbar">
          <div className="auth-brand">
            <div className="auth-brand-logo">✦</div>
            <div className="auth-brand-name">{brandName}</div>
          </div>

          <div className="auth-controls">
            <LanguageSwitcher />
            <button
              type="button"
              className="auth-theme-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              ◐
            </button>
          </div>
        </div>

        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {children}

        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </div>
  );
}