# 🎮 GameCoach AI — Инструкция по запуску

## Стек
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Axios
- **ИИ**: Ollama (локальная модель, без API ключей)
- **БД**: PostgreSQL (pgAdmin)

---

## 1. Подготовка PostgreSQL

Открой pgAdmin и создай базу данных:
```sql
CREATE DATABASE gameai;
```

Убедись что пользователь `postgres` с паролем `12345` существует (или поменяй в `.env`).

---

## 2. Установка Ollama

Скачай с https://ollama.com и установи.

Запусти сервер (если не запущен автоматически):
```bash
ollama serve
```

Скачай модель (один раз):
```bash
ollama pull llama3.2
```

Проверь что работает:
```bash
curl http://localhost:11434/api/tags
```

### Другие модели (на выбор)
- `ollama pull mistral` — хорошая, легкая
- `ollama pull qwen2.5:7b` — отлично понимает русский
- `ollama pull gemma3:4b` — быстрая

Если меняешь модель — поменяй `OLLAMA_MODEL` в `backend/.env`.

---

## 3. Запуск Backend

```bash
cd backend
npm install
```

Настрой `.env` (уже создан):
```
DATABASE_URL="postgresql://postgres:12345@localhost:5432/gamecoachai"
JWT_SECRET=my_super_secret_key_change_me
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Создай таблицы в БД:
```bash
npx prisma db push
npx prisma generate
```

Запусти сервер:
```bash
npm run dev
```

Должно появиться:
```
🚀 Сервер запущен на порту 5000
🤖 Ollama: http://localhost:11434
📦 Модель: llama3.2
```

---

## 4. Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Открой: **http://localhost:5173**

---

## 5. Создание администратора

После регистрации первого пользователя, зайди в pgAdmin и выполни:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

После этого появится раздел "Панель администратора" в меню.

---

## 6. Проверка работы

1. Открой http://localhost:5173
2. Зарегистрируйся
3. В профиле выбери игру (например, CS2)
4. Перейди в "Чат с ИИ"
5. Создай новый чат и напиши вопрос
6. Если Ollama запущена — получишь реальный ответ от ИИ

---

## Структура проекта

```
gamecoachai/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Точка входа, Express
│   │   ├── db.ts               # Prisma клиент
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT аутентификация
│   │   └── routes/
│   │       ├── auth.ts         # /auth/* — регистрация, вход, профиль
│   │       ├── chat.ts         # /chat/* — диалоги + Ollama
│   │       └── admin.ts        # /admin/* — управление пользователями
│   ├── prisma/
│   │   └── schema.prisma       # Схема БД (User, Dialog, Message)
│   ├── .env                    # Настройки (БД, JWT, Ollama)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/client.ts       # Axios + автоматический токен
    │   ├── context/
    │   │   ├── AuthContext.tsx  # Глобальное состояние пользователя
    │   │   └── ToastContext.tsx # Уведомления
    │   ├── components/
    │   │   └── Layout.tsx       # Сайдбар + навигация
    │   └── pages/
    │       ├── LandingPage.tsx  # Главная страница
    │       ├── LoginPage.tsx    # Вход
    │       ├── RegisterPage.tsx # Регистрация
    │       ├── ChatPage.tsx     # ⭐ Чат с ИИ (основная страница)
    │       ├── HistoryPage.tsx  # История диалогов
    │       ├── ProfilePage.tsx  # Профиль + смена игры
    │       └── AdminPage.tsx    # Панель администратора
    ├── vite.config.ts           # Proxy → backend:5000
    └── package.json
```

---

## API Endpoints

| Метод  | URL                          | Описание                       |
|--------|------------------------------|--------------------------------|
| POST   | /auth/register               | Регистрация                    |
| POST   | /auth/login                  | Вход                           |
| GET    | /auth/me                     | Данные текущего пользователя   |
| PATCH  | /auth/profile                | Обновить никнейм/игру          |
| GET    | /chat/dialogs                | Список диалогов                |
| POST   | /chat/dialogs                | Создать диалог                 |
| DELETE | /chat/dialogs/:id            | Удалить диалог                 |
| GET    | /chat/dialogs/:id/messages   | Сообщения диалога              |
| POST   | /chat/send                   | Отправить сообщение → Ollama   |
| GET    | /admin/users                 | Список пользователей (admin)   |
| GET    | /admin/stats                 | Статистика (admin)             |
| DELETE | /admin/users/:id             | Удалить пользователя (admin)   |

---

## Частые ошибки

**"Ошибка подключения к Ollama"**
→ Запусти: `ollama serve` и `ollama pull llama3.2`

**"Cannot connect to database"**
→ Проверь что PostgreSQL запущен и DATABASE_URL в .env верный

**"Invalid token"**
→ Выйди из аккаунта и войди заново
