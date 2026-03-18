# AI CRM SaaS — інструкція українською

## Що це
Production-style MVP для майстрів і сервісного бізнесу:
- багатомовний сайт: **English / Українська / Čeština**
- React frontend з красивим UI
- Node.js + Express backend
- PostgreSQL база даних
- JWT авторизація
- клієнти, записи, платежі
- AI асистент для відповідей клієнтам
- AI бізнес-поради
- Telegram notifications
- n8n webhook integration

## Структура
- `frontend/` — сайт
- `backend/` — API
- `backend/schema.sql` — SQL для створення таблиць
- `backend/.env.example` — приклад змінних середовища

## 1. Що потрібно встановити
Перед стартом встанови:
- **Node.js 20+**
- **PostgreSQL 14+**
- npm

## 2. Налаштування бази даних
### Створи базу:
Назва прикладу:
`ai_crm_saas`

### Виконай SQL:
Відкрий файл:
`backend/schema.sql`

і виконай його в PostgreSQL.

## 3. Налаштування backend
Перейди в папку `backend`.

### Встанови залежності:
```bash
npm install
```

### Створи `.env`
Скопіюй `.env.example` у `.env`.

Приклад:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_crm_saas
JWT_SECRET=change_this_secret
OPENAI_API_KEY=your_openai_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/reminder
```

### Запусти backend:
```bash
npm run dev
```

Після запуску backend буде доступний тут:
`http://localhost:5000`

Перевірка health endpoint:
`http://localhost:5000/api/health`

## 4. Налаштування frontend
Перейди в папку `frontend`.

### Встанови залежності:
```bash
npm install
```

### Запусти frontend:
```bash
npm run dev
```

Сайт буде доступний тут:
`http://localhost:5173`

## 5. Як користуватись
### Реєстрація
1. Відкрий сайт
2. Обери мову зверху справа: EN / UA / CZ
3. Натисни Register / Реєстрація
4. Створи акаунт

### Після входу доступні сторінки
- **Dashboard** — статистика і AI бізнес-поради
- **Clients** — база клієнтів
- **Appointments** — записи клієнтів
- **Payments** — платежі
- **AI Assistant** — генерація відповіді клієнту

## 6. Як працює AI Assistant
На сторінці **AI Assistant**:
1. введи ім’я клієнта
2. встав повідомлення клієнта
3. задай tone
4. натисни Generate reply

Backend відправляє запит до OpenAI і повертає готову відповідь.
Мова AI-відповіді залежить від мови акаунта користувача.

## 7. Як працюють AI business insights
На Dashboard backend рахує:
- кількість клієнтів
- кількість записів
- кількість платежів
- суму доходу

Потім ці цифри відправляються в OpenAI, і система повертає короткі практичні поради.

## 8. Telegram інтеграція
Щоб працювали Telegram notifications:
- заповни `TELEGRAM_BOT_TOKEN`
- заповни `TELEGRAM_CHAT_ID`

Після створення нового запису backend відправить повідомлення в Telegram.

## 9. n8n інтеграція
Щоб працював n8n webhook:
- створи webhook у n8n
- встав його в `N8N_WEBHOOK_URL`

Після створення запису backend надішле дані в n8n.

Через n8n можна далі зробити:
- нагадування клієнтам
- Google Calendar sync
- email
- WhatsApp
- follow-up messages

## 10. Як деплоїти
### Frontend
Рекомендовано:
- **Vercel**

### Backend
Рекомендовано:
- **Railway** або **Render**

### Database
Рекомендовано:
- PostgreSQL на Railway / Neon / Supabase

## 11. Що ще можна додати далі
Щоб зробити проект ще сильнішим:
- edit/delete для клієнтів
- edit/delete для записів
- calendar view
- Stripe subscriptions
- admin dashboard
- role-based access
- audit logs
- rate limiting
- request validation
- file uploads
- image uploads
- CRM notes history
- real reminder scheduler

## 12. Важливо
Це сильний production-style starter, але перед реальним комерційним запуском краще ще додати:
- валідацію даних
- refresh tokens
- більш жорстку security конфігурацію
- rate limiting
- unit/integration tests
- centralized logging
- Docker
- CI/CD

## 13. Швидкий старт
### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 14. Для портфоліо / CV
Назва:
**AI CRM SaaS for Service Professionals**

Короткий опис:
Full-stack AI-powered CRM platform with multilingual dashboard, client management, appointment scheduling, payment tracking, Telegram automation, and AI-generated replies.
