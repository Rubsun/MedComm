# MedComm Platform — Архитектура

Образовательная веб-платформа для студентов медицинских вузов на тему «Коммуникация врача с пациентом».

**Стек:** FastAPI + SQLAlchemy 2 async + PostgreSQL 17 + Alembic / React 19 + Vite + TypeScript + Tailwind + shadcn/ui.

---

## Топология

```
┌────────────┐   HTTPS    ┌──────────────────┐   /api/*    ┌──────────────┐
│  Browser   │ ─────────► │  nginx (frontend │ ──────────► │  FastAPI     │
│  (SPA)     │            │  Docker, port 80) │             │  uvicorn     │
└────────────┘            │  SPA fallback    │             │  port 8000   │
                          │  serves dist/    │             └──────┬───────┘
                          └──────────────────┘                    │
                                                                  ▼
                                                          ┌──────────────┐
                                                          │ PostgreSQL 17 │
                                                          │ medcomm + …_test │
                                                          └──────────────┘
```

В dev-режиме без docker: Vite на 5173, FastAPI на 8000, фронт ходит к `VITE_API_BASE_URL=http://localhost:8000`.

---

## Domain model

```
Program ──< Course ──< Module ──< Lesson ──< LessonBlock
   │           │
   │           └──< Enrollment >── User
   │
   └── (видимость регулируется is_published на каждом уровне)

Lesson ──< UserProgress >── User           (факт «урок пройден»)
LessonBlock(type='quiz')     ──< QuizResult >── User
LessonBlock(type='practice') ──< PracticeResult >── User
```

### Таблицы

| Таблица | Поля (ключевые) | Описание |
|---|---|---|
| `users` | id, email (unique), password_hash (bcrypt), role: `student\|admin`, first_name, last_name, is_active, created_at | Учётка |
| `revoked_tokens` | id, jti (unique), expires_at | Чёрный список refresh-jti |
| `programs` | id, title, description, image_url, is_published, sort_order | Верхний уровень контента |
| `courses` | id, program_id, title, description, sort_order, is_published | Курс внутри программы |
| `modules` | id, course_id, title, description, sort_order, is_locked | Модуль внутри курса |
| `lessons` | id, module_id, title, description, type (`theory\|practice\|mixed`), duration_min, sort_order, is_published | Урок |
| `lesson_blocks` | id, lesson_id, type (`text\|image\|video\|practice\|quiz`), sort_order, **data JSONB** | Полиморфный блок урока |
| `enrollments` | id, user_id, course_id (unique together), enrolled_at | Запись на курс |
| `user_progress` | id, user_id, lesson_id (unique together), completed_at | Урок завершён |
| `quiz_results` | id, user_id, lesson_block_id (unique), score, best_score, max_score, passed, attempts, completed_at | Результат квиза |
| `practice_results` | id, user_id, lesson_block_id (unique), selected_option_ids JSONB, is_correct, completed_at | Результат практики |

### Полиморфный `lesson_blocks.data`

| `type` | Структура `data` |
|---|---|
| `text` | `{ "html": "..." }` *(или `markdown`)* |
| `image` | `{ "url": "/media/..." , "alt": "..." }` |
| `video` | `{ "url": "/media/..." }` |
| `practice` | `{ "situation": "...", "patient": {...}, "options": [{"id","text","is_correct","feedback"}], "explanation": "..." }` |
| `quiz` | `{ "passing_score": 70, "questions": [{"id","text","options":[...],"correct_id"}] }` |

Эти shape'ы — контракт между админ-редакторами (`app/src/components/admin/*BlockEditor.tsx`) и публичными рендерерами (`app/src/components/lesson-blocks/*.tsx`). Менять только синхронно.

---

## Auth

### Токены

| Токен | Транспорт | TTL | Ротация |
|---|---|---|---|
| `access` | JSON в `/login` ответе, далее `Authorization: Bearer ...` | 15 мин (`ACCESS_TOKEN_EXPIRE_MINUTES`) | нет; истёк → `/refresh` |
| `refresh` | **httpOnly Set-Cookie** (`samesite=lax`, `secure` управляется `COOKIE_SECURE`) | 30 дней (`REFRESH_TOKEN_EXPIRE_DAYS`) | при каждом `/refresh` jti старого токена пишется в `revoked_tokens` |

### Поток на фронте

1. Инициализация (`AuthContext.useEffect`): без access-токена дёргаем `POST /api/auth/refresh` (cookie уйдёт автоматически благодаря `withCredentials: true`). Если получили — сохраняем access в памяти, грузим `/me`.
2. Любой запрос: `apiClient` (axios) добавляет `Authorization: Bearer <access>`.
3. На `401` interceptor одноразово зовёт `/refresh`, повторяет исходный запрос. Если refresh не прошёл — `window.dispatchEvent('auth:logout')`.
4. `logout`: `POST /api/auth/logout` (отзывает refresh) + локальная очистка.

### Видимость для студента vs админа

`get_optional_admin` (в `dependencies.py`) — мягкая зависимость: если токена нет, возвращает `False`; если есть и валиден — возвращает `payload.role == 'admin'`. Используется в листингах программ/курсов/уроков, чтобы фильтровать по `is_published`.

---

## API endpoints (актуально)

### Auth (`/api/auth`)
| Метод | URL | Доступ | Тело / cookie |
|---|---|---|---|
| POST | `/register` | публично | `RegisterRequest` |
| POST | `/login` | публично | `LoginRequest` → `TokenResponse` + Set-Cookie refresh |
| POST | `/refresh` | по cookie | → `TokenResponse` + новая cookie |
| POST | `/logout` | bearer | отзывает refresh |
| GET | `/me` | bearer | `UserOut` |

### Контент
| Метод | URL | Доступ |
|---|---|---|
| GET | `/api/programs` (`?is_admin` через bearer) | публично, фильтр published |
| POST/PUT/PATCH/DELETE | `/api/programs(/...)` | admin |
| GET | `/api/courses?program_id=` | публично |
| POST/PUT/PATCH/DELETE | `/api/courses(/...)` | admin |
| GET | `/api/modules?course_id=` | публично |
| POST/PUT/PATCH/DELETE | `/api/modules(/...)` | admin |
| GET | `/api/lessons?module_id=` | публично |
| POST/PUT/PATCH/DELETE | `/api/lessons(/...)` | admin |
| GET | `/api/lessons/{id}/blocks` | публично |
| POST/PUT/DELETE/PATCH | `/api/lessons/{id}/blocks(/...)` | admin |

Все ресурсы поддерживают `PATCH /reorder` (массив `[{id, sort_order}]`) и `PATCH /{id}/publish` (toggle).

### Прогресс (студент)
| Метод | URL |
|---|---|
| POST | `/api/progress/enroll` |
| POST | `/api/progress/complete-lesson` |
| POST | `/api/progress/submit-practice` |
| POST | `/api/progress/submit-quiz` |

### Студенты (admin)
| Метод | URL |
|---|---|
| GET | `/api/students?search=` |
| GET | `/api/students/{id}/progress` |
| PATCH | `/api/students/{id}/deactivate` |

### Аналитика (admin)
| Метод | URL |
|---|---|
| GET | `/api/analytics/overview` |
| GET | `/api/analytics/completion` |
| GET | `/api/analytics/quiz-results` |
| GET | `/api/analytics/dropoff` |

### Медиа (admin)
| Метод | URL | Загрузка |
|---|---|---|
| POST | `/api/media/upload` | multipart `file`; jpg/png/webp/mp4/webm; ≤ 50 МБ |

Статика отдаётся `/media/<filename>` через `StaticFiles`.

### Health
| GET | `/api/health` |

---

## Frontend (`app/`)

```
app/src/
├── api/                axios клиент + по файлу на каждый ресурс
├── context/AuthContext.tsx
├── store/useStore.ts          Zustand: только UI state (sidebar)
├── types/
│   ├── api.ts                  DTO от бэка
│   └── index.ts                UI-типы (если понадобятся)
├── components/
│   ├── ui/                     shadcn компоненты (40+)
│   ├── layout/AppLayout.tsx    sidebar + outlet (для protected зоны)
│   ├── lesson-blocks/          Text/Image/Video/Practice/Quiz — render
│   └── admin/                  *BlockEditor — admin edit для каждого типа
├── pages/
│   ├── Dashboard.tsx
│   ├── LessonPage.tsx
│   ├── Profile.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── admin/                  Programs/Courses/Lessons/LessonEditor/Students/StudentProgress/Analytics
├── lib/utils.ts
├── App.tsx                     Router + AuthProvider + ProtectedRoute/AdminRoute
└── main.tsx
```

Запросы — через `axios` инстанс из `api/client.ts` (с baseURL и refresh-interceptor). Ничего не должно ходить «голым» fetch'ом.

### Зависимости (важные)
- React 19, react-router-dom 7
- shadcn/ui + Radix
- Tailwind 3, tailwindcss-animate
- Recharts (графики аналитики)
- @dnd-kit (drag-n-drop в admin-редакторах)
- Zustand (UI state), но не для server state — server state живёт в локальном `useState`/контекстах.
- date-fns

### Дизайн-система (после миграции)

В `frontend/index.html` и `frontend/ui.jsx` лежит teal-палитра + Inter / Inter Tight / JetBrains Mono. Эти CSS-переменные и базовые компоненты (`Icon`, `KpiCard`, `Sidebar`, `Badge`, `Progress`, `Card`) переносятся в `app/`. До завершения миграции в `app/` используется shadcn-дефолт (синие тона).

---

## Dev workflow

```bash
# Терминал 1 — БД
docker compose up -d db

# Терминал 2 — бэк
cd backend
cp .env.example .env             # один раз
alembic upgrade head
python seed_admin.py             # один раз — создать админа
uvicorn main:app --reload

# Терминал 3 — фронт
cd app
npm install                      # один раз
npm run dev                       # http://localhost:5173
```

Для тестов: `pytest` из `backend/`. Используется отдельная БД `medcomm_test` (создаётся `docker/init.sql`).

---

## Roadmap (открытые работы)

См. `~/.claude/projects/-home-maksim-PycharmProjects-MedComm/memory/migration_plan.md` и список тасков. Кратко:

1. ✅ Backend CRUD + auth + analytics + students.
2. ✅ Frontend MVP с реальной интеграцией (старый дизайн).
3. 🔄 Миграция дизайна `frontend/*.jsx` → `app/` (страница за страницей).
4. ⏳ Achievements + streak — не реализованы ни на бэке, ни на фронте; нужно добавить модели, миграцию, эндпоинты, UI и admin-редактор.
5. ⏳ Удалить `frontend/` после завершения миграции.
6. ⏳ Demo seed-скрипт для быстрой подгрузки полного контента.
7. 💤 ⌘K command palette — отложено до отдельной задачи.
