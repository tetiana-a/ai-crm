import { useEffect, useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from '../components/EmptyState';

export default function ClientsPage() {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    messenger: '',
    notes: '',
  });

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    try {
      await api.post('/clients', form);
      setForm({
        full_name: '',
        phone: '',
        email: '',
        messenger: '',
        notes: '',
      });
      await load();
    } catch (error) {
      console.error('Failed to create client:', error);
      alert(error?.response?.data?.message || 'Failed to create client');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <span className="page-kicker">◎ CRM</span>
          <h1 className="page-title">{t.clients || 'Clients'}</h1>
          <p className="page-sub">
            {t.clientsSub || 'Manage your clients and keep all contact details in one place.'}
          </p>
        </div>
      </div>

      <div className="page-grid">
        <div className="panel">
          <h2>{t.addClient || 'Add Client'}</h2>

          <form className="form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">{t.fullName || 'Full Name'}</label>
              <input
                placeholder={t.fullName || 'Full Name'}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.phone || 'Phone'}</label>
              <input
                placeholder={t.phone || 'Phone'}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.email || 'Email'}</label>
              <input
                type="email"
                placeholder={t.email || 'Email'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.messenger || 'Messenger'}</label>
              <input
                placeholder={t.messenger || 'Messenger'}
                value={form.messenger}
                onChange={(e) => setForm({ ...form, messenger: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.notes || 'Notes'}</label>
              <textarea
                placeholder={t.notes || 'Notes'}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button className="primary-btn" type="submit">
              + {t.addClient || 'Add Client'}
            </button>
          </form>
        </div>

        <div>
          {loading ? (
            <div className="panel">Loading...</div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon="👥"
              title={t.noClientsTitle || 'No clients yet'}
              text={
                t.noClientsYet ||
                'Start building your client base. Add your first client to begin.'
              }
            />
          ) : (
            <div className="cards-grid stagger">
              {clients.map((c) => (
                <article className="item-card" key={c.id}>
                  <h3>{c.full_name}</h3>
                  <p>{c.phone || t.noPhone || 'No phone'}</p>

                  {c.email && (
                    <p className="muted" style={{ fontSize: 13 }}>
                      {c.email}
                    </p>
                  )}

                  {c.messenger && (
                    <p className="mono" style={{ fontSize: 12 }}>
                      {c.messenger}
                    </p>
                  )}

                  {c.notes && <p className="muted">{c.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
