import { useEffect, useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from '../components/EmptyState';

const STATUS_MAP = {
  booked: 'booked',
  completed: 'completed',
  cancelled: 'cancelled',
};

export default function AppointmentsPage() {
  const { t } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    service_name: '',
    appointment_date: '',
    status: 'booked',
  });

  async function load() {
    const [appointmentsResponse, clientsResponse] = await Promise.all([
      api.get('/appointments'),
      api.get('/clients'),
    ]);

    setAppointments(appointmentsResponse.data);
    setClients(clientsResponse.data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/appointments', form);

    setForm({
      client_id: '',
      service_name: '',
      appointment_date: '',
      status: 'booked',
    });

    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <span className="page-kicker">◷ Schedule</span>
          <h1 className="page-title">{t.appointments || 'Appointments'}</h1>
          <p className="page-sub">
            {t.appointmentsSub || 'Organize your schedule and track bookings with ease.'}
          </p>
        </div>
      </div>

      <div className="page-grid">
        <div className="panel">
          <h2>{t.createAppointment || 'Create Appointment'}</h2>

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
              <label className="form-label">{t.serviceName || 'Service Name'}</label>
              <input
                placeholder={t.serviceName || 'Service Name'}
                value={form.service_name}
                onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.dateTime || 'Date & Time'}</label>
              <input
                type="datetime-local"
                value={form.appointment_date}
                onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.status || 'Status'}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button className="primary-btn" type="submit">
              + {t.createAppointment || 'Create Appointment'}
            </button>
          </form>
        </div>

        <div>
          {appointments.length === 0 ? (
            <EmptyState
              icon="📅"
              title={t.noAppointmentsTitle || 'No appointments scheduled'}
              text={
                t.noAppointmentsYet ||
                'Create your first booking and manage your time efficiently.'
              }
            />
          ) : (
            <div className="cards-grid stagger">
              {appointments.map((a) => (
                <article className="item-card" key={a.id}>
                  <div className="flex-between">
                    <h3>{a.client_name || t.client || 'Client'}</h3>
                    <span className={`status-pill ${STATUS_MAP[a.status] || 'booked'}`}>
                      {a.status}
                    </span>
                  </div>

                  <p>{a.service_name || t.serviceName || 'Service'}</p>

                  <p className="muted mono" style={{ fontSize: 12 }}>
                    {a.appointment_date
                      ? new Date(a.appointment_date).toLocaleString()
                      : t.noDate || 'No date'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}