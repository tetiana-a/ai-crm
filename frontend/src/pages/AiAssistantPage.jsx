import { useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from '../components/EmptyState';

export default function AiAssistantPage() {
  const { t } = useLanguage();

  const [form, setForm] = useState({
    clientName: '',
    message: '',
    tone: 'friendly professional',
  });

  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();

    if (!form.message.trim()) return;

    setLoading(true);
    setReply('');
    setError('');

    try {
      const { data } = await api.post('/ai/reply', form);
      setReply(data?.reply || '');
    } catch (err) {
      console.error(err);
      setError('AI error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page fade-in">
      <div className="page-header">
        <div className="page-title-group">
          <span className="page-kicker">✦ AI</span>
          <h1 className="page-title">{t.aiAssistant || 'AI Assistant'}</h1>
          <p className="page-sub">
            {t.aiAssistantSub || 'Generate smart replies for your clients instantly.'}
          </p>
        </div>
      </div>

      <div className="page-grid ai-grid">
        <div className="panel">
          <h2>{t.generateReply || 'Generate Reply'}</h2>

          <form className="form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">{t.clientName || 'Client Name'}</label>
              <input
                value={form.clientName}
                placeholder={t.clientName || 'Client Name'}
                onChange={(e) =>
                  setForm({ ...form, clientName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.clientMessage || 'Message'}</label>
              <textarea
                required
                value={form.message}
                placeholder={t.clientMessage || 'Client message'}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.tone || 'Tone'}</label>
              <select
                value={form.tone}
                onChange={(e) =>
                  setForm({ ...form, tone: e.target.value })
                }
              >
                <option value="friendly professional">Friendly Professional</option>
                <option value="formal">Formal</option>
                <option value="warm and empathetic">Warm & Empathetic</option>
                <option value="concise and direct">Concise & Direct</option>
              </select>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button className="primary-btn" type="submit" disabled={loading}>
              ✦ {loading ? (t.generating || 'Generating...') : (t.generateReply || 'Generate Reply')}
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>{t.reply || 'Reply'}</h2>

          {loading ? (
            <div className="generating">
              <div className="dot-blink">
                <span></span>
                <span></span>
                <span></span>
              </div>
              {t.generating || 'Generating...'}
            </div>
          ) : !reply ? (
            <EmptyState
              icon="✨"
              title={t.aiReadyTitle || 'AI Assistant ready'}
              text={
                t.noReply ||
                'Enter a client message and generate a smart reply instantly.'
              }
            />
          ) : (
            <div className="reply-box">{reply}</div>
          )}
        </div>
      </div>
    </div>
  );
}