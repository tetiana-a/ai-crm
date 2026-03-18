import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import '../auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', form);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user?.preferred_language) {
        localStorage.setItem('lang', data.user.preferred_language);
      }

      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      theme={theme}
      onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      title={t('login')}
      subtitle={t('tagline')}
      footer={
        <>
          {t('noAccount')} <Link to="/register">{t('register')}</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label className="auth-label">{t('email')}</label>
          <input
            className="auth-input"
            type="email"
            name="email"
            placeholder={t('email')}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="auth-label">{t('password')}</label>
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder={t('password')}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? t('signingIn') : t('login')}
        </button>
      </form>
    </AuthLayout>
  );
}