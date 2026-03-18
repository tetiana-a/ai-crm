import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import '../auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [form, setForm] = useState({
    name: '',
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
      const { data } = await api.post('/auth/register', {
        ...form,
        preferred_language: language,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('lang', data.user?.preferred_language || language);

      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      theme={theme}
      onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      title={t('register')}
      subtitle={t('tagline')}
      footer={
        <>
          {t('alreadyAccount')} <Link to="/login">{t('login')}</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label className="auth-label">{t('fullName')}</label>
          <input
            className="auth-input"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('fullName')}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label className="auth-label">{t('email')}</label>
          <input
            className="auth-input"
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('email')}
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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={t('password')}
            autoComplete="new-password"
            required
          />
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? t('creating') : t('createAccount')}
        </button>
      </form>
    </AuthLayout>
  );
}