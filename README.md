# 🎮 GameCoach AI — Railway Deploy

## Переменные окружения в Railway

В Railway → Variables добавь:

```
DATABASE_URL=postgresql://...   ← берётся из Railway PostgreSQL сервиса
JWT_SECRET=любая_длинная_строка
HUGGINGFACE_TOKEN=hf_...         ← твой токен с huggingface.co/settings/tokens
```

## Как задеплоить

1. Залей эти файлы в GitHub репозиторий (заменить всё кроме .env)
2. В Railway: New Project → Deploy from GitHub repo
3. Добавь PostgreSQL: + New → Database → PostgreSQL
4. Добавь переменные окружения (см. выше)
5. Railway автоматически запустит build и deploy

## Модель ИИ

Используется `mistralai/Mistral-7B-Instruct-v0.3` — бесплатная, не требует специального доступа.
