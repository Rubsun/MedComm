# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MedComm Platform — образовательная веб-платформа для студентов медицинских вузов на тему «Коммуникация врача с пациентом». Stack: **FastAPI** (бэк) + **React 19 + Vite + TypeScript** (фронт) + **PostgreSQL 17**.

> ⚠️ В прошлых ревизиях этого файла было написано «frontend-only demo, future Django integration» — это неверно. Бэк уже есть и написан на FastAPI (не Django).

## Repo layout

```
MedComm/
├── backend/                 FastAPI приложение
│   ├── main.py              app + CORS + media static + роутеры
│   ├── config.py            Pydantic settings (.env)
│   ├── database.py          SQLAlchemy async engine + Base
│   ├── dependencies.py      get_db, get_current_user, require_admin, get_optional_admin
│   ├── models/              SQLAlchemy 2 модели (user, content, progress)
│   ├── schemas/             Pydantic v2 DTO
│   ├── routers/             auth, programs, courses, modules, lessons, progress, students, analytics, media
│   ├── services/            auth (JWT/bcrypt), storage (uploads), analytics
│   ├── alembic/             миграции
│   ├── tests/               pytest (на каждый router)
│   ├── seed_admin.py        интерактивно создаёт админа
│   ├── requirements.txt
│   ├── Dockerfile           устанавливает в /app_root так, чтобы `backend` был пакетом
│   └── .env.example
├── app/                     ПРОДАКШН-ФРОНТ (Vite + React 19 + TS)
│   ├── src/
│   │   ├── api/             axios клиент + по файлу на каждый ресурс бэка
│   │   ├── context/         AuthContext (silent-refresh при загрузке)
│   │   ├── components/      ui/ (shadcn), layout/, lesson-blocks/, admin/
│   │   ├── pages/           Dashboard, LessonPage, Profile, Login/Register
│   │   ├── pages/admin/     Programs, Courses, Lessons, LessonEditor, Students, StudentProgress, Analytics
│   │   ├── store/useStore.ts  Zustand — только UI state (sidebarOpen). Auth и user в AuthContext.
│   │   ├── types/           api.ts (DTO от бэка), index.ts (UI-типы)
│   │   ├── lib/utils.ts     cn helper
│   │   └── App.tsx          Router (BrowserRouter), ProtectedRoute, AdminRoute
│   ├── Dockerfile           multi-stage build → nginx
│   ├── nginx.conf           SPA fallback + /api/ → backend:8000
│   ├── vite.config.ts       base '/', alias `@` → src
│   ├── package.json         React 19, Radix, Recharts, @dnd-kit, axios, zustand, react-router 7
│   └── .env.development     VITE_API_BASE_URL=http://localhost:8000
├── frontend/                ⚠️ ВРЕМЕННО — новый дизайн от claude-design (single-file Babel demo, моки)
│                              используется ТОЛЬКО как референс при миграции дизайна в `app/`,
│                              удаляется после завершения миграции (см. migration_plan)
├── docker/init.sql          создаёт БД medcomm и medcomm_test (для тестов)
├── docker-compose.yml       db + backend + frontend (nginx 80) — собирает фронт из `./app`
├── ARCHITECTURE.md          подробное описание архитектуры
└── CLAUDE.md                этот файл
```

## Commands

### Backend (из корня репо, `python` с активированным venv)

```bash
# Установка
cd backend && pip install -r requirements.txt

# Миграции
cd backend && alembic upgrade head

# Запуск (dev)
cd backend && uvicorn main:app --reload --port 8000
# либо как пакет из корня:
uvicorn backend.main:app --reload --port 8000

# Тесты
cd backend && pytest

# Создать админа
cd backend && python seed_admin.py
```

### Frontend (`app/`)

```bash
cd app
npm install
npm run dev       # vite dev server, http://localhost:5173
npm run build     # tsc -b && vite build → dist/
npm run lint
npm run preview
```

### Полный стек (docker)

```bash
docker compose up -d      # db (5432, internal), backend (8000), frontend (80, nginx + /api proxy)
docker compose logs -f backend
docker compose down -v    # снести с volume'ами (включая БД)
```

После старта зайти на http://localhost — фронт сам проксирует `/api/*` к бэку.

## Architecture (короткая версия)

### Auth flow

- `POST /api/auth/login` → access JWT (HS256, 15 мин) в JSON + refresh JWT в **httpOnly cookie** (30 дней).
- `POST /api/auth/refresh` (по cookie) → ротация refresh-а, старый jti добавляется в `revoked_tokens`.
- `app/src/api/client.ts` хранит access в памяти, axios interceptor дёргает `/refresh` на любой 401 (с дедупом через `refreshPromise`).
- `AuthContext` при mount вызывает `/refresh` → `/me`, чтобы восстановить сессию.

### Контент-иерархия

`Program → Course → Module → Lesson → LessonBlock`

Блок (`LessonBlock`) — это полиморфный JSONB:
- `type='text'` — `{ html | markdown }`
- `type='image'` — `{ url, alt }`
- `type='video'` — `{ url }`
- `type='practice'` — `{ situation, options: [{id, text, is_correct, feedback}], explanation }`
- `type='quiz'` — `{ questions: [...], passing_score: int }`

Источник правды — `app/src/components/lesson-blocks/*` (рендер) и `app/src/components/admin/*BlockEditor.tsx` (редакторы).

### Прогресс

- `Enrollment` (user × course, уникальный)
- `UserProgress` (user × lesson, уникальный)
- `QuizResult` (user × lesson_block, с `best_score`, `max_score`, `attempts`, `passed`)
- `PracticeResult` (user × lesson_block, с `selected_option_ids`, `is_correct`)

`POST /api/progress/submit-practice|submit-quiz` идемпотентны — обновляют существующую запись, не создают дубликат.

### Видимость

Студенты видят только опубликованное — `Program.is_published`, `Course.is_published`, `Lesson.is_published`. Админ видит всё через `get_optional_admin` (без обязательной авторизации, но если токен есть — он должен быть валидным).

## Migration in progress

Сейчас идёт миграция дизайна: новый визуал из `frontend/*.jsx` (claude-design демо) переносится в `app/` постранично. План — в `~/.claude/projects/.../memory/migration_plan.md`. Папка `frontend/` будет удалена после завершения.

**Не трогать**: `frontend/` править бесполезно (это статический Babel-standalone демо). Все изменения дизайна — в `app/`.

## Default conventions

- **Бэк**: SQLAlchemy 2 mapped style (`Mapped[...]`/`mapped_column`), асинхронные сессии. Pydantic v2 (`model_config = {"from_attributes": True}`). Роутеры с префиксом `/api/...`.
- **Фронт**: alias `@` → `src/`. Компоненты shadcn в `components/ui/`. Бизнес-компоненты — рядом по фиче. Никаких mock-данных в `app/` — только реальные API через `src/api/`.
- **Tailwind v3** с темой shadcn. CSS-переменные дизайн-системы (teal-палитра) добавляются на этапе миграции дизайна — см. план.
- **Migrations**: одна миграция `527f2fd19f7c_initial_schema.py` уже наложена. Новые ресурсы (achievements/streak) добавлять отдельной миграцией.

## Known gotchas

- В роутерах `/reorder` идёт ДО `/{id}/...` — иначе FastAPI пытается распарсить "reorder" как `int`. Сохранять этот порядок при добавлении новых.
- Бэк-Dockerfile хитро устроен: код кладётся в `/app_root/backend/`, `PYTHONPATH=/app_root`, чтобы импорт `from backend.x import y` работал и в Docker, и локально.
- Vite `base: '/'` — без него ассеты ломались на вложенных роутах.
- При локальной разработке БД для тестов отдельная (`medcomm_test`), создаётся `docker/init.sql`.
- В docker-compose `CORS_ORIGINS` указан как JSON-массив строкой; `pydantic-settings` парсит сам.
