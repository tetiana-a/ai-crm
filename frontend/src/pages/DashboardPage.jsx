import { useEffect, useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function StatCard({ icon, label, value, trend }) {
  return (
    <div className="stat-card fade-in">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ clients: 0, appointments: 0, payments: 0, revenue: 0 });
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [d, i] = await Promise.all([
          api.get('/dashboard'),
          api.get('/ai/insights'),
        ]);
        setStats(d.data);
        setInsights(i.data.insights);
      } catch (e) {
        setInsights(t.loadingInsights);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t.loadingInsights]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <span className="page-kicker">{t.quickStats}</span>
          <h1 className="page-title">{t.dashboard}</h1>
        </div>
      </div>

      <div className="hero-card">
        <div className="hero-card-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            AI Active
          </div>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
        </div>
      </div>

      <div className="stats-grid stagger">
        <StatCard icon="◎" label={t.clientsLabel}      value={stats.clients}         trend={t.statTrendClients} />
        <StatCard icon="◷" label={t.appointmentsLabel} value={stats.appointments}     trend={t.statTrendAppts} />
        <StatCard icon="◈" label={t.paymentsLabel}     value={stats.payments}         trend={t.statTrendPayments} />
        <StatCard icon="€" label={t.revenue}           value={`€ ${Number(stats.revenue || 0).toFixed(2)}`} trend={t.statTrendRevenue} />
      </div>

      <div className="panel">
        <h2>✦ {t.aiInsights}</h2>
        {loading ? (
          <div className="generating">
            <div className="dot-blink"><span/><span/><span/></div>
            {t.loadingInsights}
          </div>
        ) : (
          <pre className="insights-block">{insights}</pre>
        )}
      </div>
    </div>
  );
}


<button
  onClick={async () => {
    try {
      const { data } = await api.get('/auth/telegram-link-code');

      alert(`Send this to bot:\n/link ${data.code}`);
    } catch (err) {
      alert('Error generating code');
    }
  }}
>
  🔗 Connect Telegram
</button>
