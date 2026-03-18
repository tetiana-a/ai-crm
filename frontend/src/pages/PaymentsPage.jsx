import { useEffect, useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from '../components/EmptyState';

export default function PaymentsPage() {
  const { t } = useLanguage();

  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    amount: '',
    method: 'cash',
    note: '',
  });

  async function load() {
    const [paymentsResponse, clientsResponse] = await Promise.all([
      api.get('/payments'),
      api.get('/clients'),
    ]);

    setPayments(paymentsResponse.data);
    setClients(clientsResponse.data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    await api.post('/payments', {
      ...form,
      amount: Number(form.amount),
    });

    setForm({
      client_id: '',
      amount: '',
      method: 'cash',
      note: '',
    });

    load();
  };

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <span className="page-kicker">◈ Finance</span>
          <h1 className="page-title">{t.payments || 'Payments'}</h1>
          <p className="page-sub">
            {t.paymentsSub || 'Track revenue, payment methods and your financial flow.'}
          </p>
        </div>

        {payments.length > 0 && <div className="amount-display">€ {total.toFixed(2)}</div>}
      </div>

      <div className="page-grid">
        <div className="panel">
          <h2>{t.addPayment || 'Add Payment'}</h2>

          <form className="form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">{t.selectClient || 'Select Client'}</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                required
              >
                <option value="">{t.selectClient || 'Select Client'}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t.amount || 'Amount'} (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.method || 'Method'}</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t.notes || 'Notes'}</label>
              <textarea
                placeholder={t.notes || 'Notes'}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            <button className="primary-btn" type="submit">
              + {t.addPayment || 'Add Payment'}
            </button>
          </form>
        </div>

        <div>
          {payments.length === 0 ? (
            <EmptyState
              icon="💳"
              title={t.noPaymentsTitle || 'No payments yet'}
              text={t.noPaymentsYet || 'Track your income and start recording payments.'}
            />
          ) : (
            <div className="cards-grid stagger">
              {payments.map((p) => (
                <article className="item-card" key={p.id}>
                  <div className="flex-between">
                    <h3>€ {Number(p.amount || 0).toFixed(2)}</h3>
                    <span className="status-pill booked">
                      {p.method || t.method || 'Method'}
                    </span>
                  </div>

                  <p className="muted mono" style={{ fontSize: 12 }}>
                    {p.payment_date
                      ? new Date(p.payment_date).toLocaleString()
                      : t.noDate || 'No date'}
                  </p>

                  {p.note && <p className="muted">{p.note}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}