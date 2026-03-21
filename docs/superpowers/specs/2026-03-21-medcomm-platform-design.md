# MedComm Platform — Design Spec
**Date:** 2026-03-21
**Status:** Approved

---

## Overview

Educational platform for medical university students focused on doctor-patient communication. Students self-register and take courses. A single admin team (one role) creates and manages all content. No multi-tenancy — one platform, one team, all users.

---

## Roles

| Role | Access | Created by |
|---|---|---|
| **Student** | Browse programs, take courses, track own progress | Self-registration |
| **Admin** | Full access to content creation, student management, analytics | Manually via CLI seed script |

---

## Content Structure

```
Program
  └── Course
        └── Module
              └── Lesson
                    └── Blocks (ordered list)
```

### Block Types (per lesson, any order, any quantity)

| Type | Description |
|---|---|
| `text` | Rich text / markdown |
| `image` | Image or infographic with optional caption |
| `video` | Embedded or uploaded video |
| `practice` | Interactive patient scenario (see below) |
| `quiz` | Test with scored questions (see below) |

Blocks stored as JSONB in PostgreSQL: `{type, order, data}`. Adding new block types requires no schema migrations.

---

## Practice Scenario

A `practice` block contains one scenario:

### Patient Profile
**Required:** name, age, gender, temperament (`choleric` | `sanguine` | `phlegmatic` | `melancholic`), chief complaint

**Optional (collapsed in editor):** avatar/photo, medical history, behavioral description, social context (profession, family), difficulty (`easy` | `medium` | `hard`)

### Scenario Body
- Situation description (what the student sees/hears)
- Goal (what the student must achieve)

### Answer Options
- **Mode: single choice** (radio) — exactly one correct answer
- **Mode: multiple choice** (checkbox) — one or more correct answers
- Each option has: text, correct flag, per-option feedback shown after selecting that option
- Shared explanation shown after submitting (regardless of correctness)

Admin toggles single/multiple via a switch — UI changes radio → checkbox.

A practice block is marked complete when the student submits their answer. Submissions are persisted in a `practice_results` table so the student's chosen answer survives page refresh.

---

## Quiz Block

A `quiz` block contains multiple questions:

### Question Structure
- Type: `single_choice` or `multiple_choice`
- Text, options (each with text + correct flag), explanation shown after answering
- Points per question

### Quiz Settings (set per quiz block)
- Passing score (% of total points, e.g. 70%)
- Max attempts (e.g. 3, or unlimited)

### Completion
- Quiz is complete when student submits all questions
- Student can retry up to max attempts
- `quiz_results` stores: `score` (latest attempt), `best_score` (highest ever), `max_score`, `passed` (based on best_score), `attempts` count, `completed_at` (last attempt time)
- "Passed" is determined by: `best_score / max_score >= passing_score %`

---

## Lesson Completion

A lesson is marked complete when the student explicitly clicks **"Завершить урок"** (Finish lesson) button shown at the bottom of the lesson. This is a manual action — no automatic completion.

---

## Module Locking

- Default: all modules are **unlocked**
- Admin can manually **lock** a module (e.g. while reworking content)
- Locked modules are visible to students but not accessible — shown with a lock icon
- Unlock = admin flips the flag back
- No automatic sequential unlock logic

---

## Enrollment

- Student clicks **"Записаться на курс"** (Enroll) — explicit action on the course page
- Enrollment is recorded in `enrollments` table
- Analytics are calculated relative to enrolled students

---

## Published / Draft State

Cascading visibility rules:
- A student can only see content where **all ancestors are published**: program → course → lesson
- Modules are **transparent** in the visibility query: they are traversed (joined) but not filtered — a module has no published state of its own. Visibility queries must still join through the modules table to reach lessons, but apply no filter on modules.is_locked (locking is a separate access concept, not a visibility concept)
- A locked module is visible (shows with a lock icon) but its lessons are inaccessible
- Unpublishing a program hides all its courses and lessons for students
- Draft lessons are invisible to students even if the module and course are published

---

## Lesson Editor (Admin)

Drag & drop block editor:
- **Left panel**: ordered list of blocks, draggable to reorder
- **Right panel**: block type picker (text / image / video / practice / quiz)
- Clicking a block opens its edit form inline
- "Publish / Draft" toggle per lesson
- `lessons.type` is an admin-assigned display label (`theory` | `practice` | `mixed`) used for UI badges only, no functional effect

---

## Architecture

**Single monolith** — one FastAPI backend, one React frontend, one deployment.

```
React App (Vite)
  /              → Student platform
  /login         → Login
  /register      → Student registration
  /admin/*       → Admin panel (role-guarded)

FastAPI
  /api/auth/*      → register, login, refresh, logout, me
  /api/programs/*  → CRUD + reorder
  /api/courses/*   → CRUD + reorder
  /api/modules/*   → CRUD + reorder + lock/unlock
  /api/lessons/*   → CRUD + reorder + blocks CRUD
  /api/media/*     → file upload, returns URL
  /api/progress/*  → enroll, complete lesson, submit practice, submit quiz
  /api/analytics/* → admin-only analytics endpoints
  /api/students/*  → admin-only student management
```

### Reordering
Drag & drop reorder operations send a single `PATCH /api/{resource}/reorder` with `[{id, order}]` — bulk update in one request.

### Database: PostgreSQL

```
users             id, email, password_hash, role, first_name, last_name, created_at, is_active
programs          id, title, description, image_url, is_published, order, created_at
courses           id, program_id, title, description, order, is_published, created_at
modules           id, course_id, title, description, order, is_locked, created_at
lessons           id, module_id, title, description, type, duration_min, order, is_published, created_at
lesson_blocks     id, lesson_id, type, order, data JSONB
enrollments       id, user_id, course_id, enrolled_at   UNIQUE(user_id, course_id)
user_progress     id, user_id, lesson_id, completed_at  UNIQUE(user_id, lesson_id)
quiz_results      id, user_id, lesson_block_id, score, best_score, max_score, passed, attempts, completed_at
                  -- lesson_block_id → lesson_blocks.id ON DELETE CASCADE
                  -- UNIQUE(user_id, lesson_block_id)
practice_results  id, user_id, lesson_block_id, selected_option_ids JSONB, is_correct, completed_at
                  -- lesson_block_id → lesson_blocks.id ON DELETE CASCADE
                  -- UNIQUE(user_id, lesson_block_id)
```

### Auth: JWT
- **Access token**: 15 min, sent as Bearer header
- **Refresh token**: 30 days, httpOnly cookie, rotated on every use (token family rotation)
- Silent refresh via frontend HTTP interceptor — transparent to user
- Refresh endpoint: `POST /api/auth/refresh`
- **Logout**: `POST /api/auth/logout` — server sets an expired `Set-Cookie` to clear the httpOnly cookie AND adds the token's JTI (JWT ID) to a `revoked_tokens` DB table (with expiry TTL). This prevents reuse of a stolen refresh token after logout.
- **CORS**: In development, `CORSMiddleware` allows `http://localhost:5173` (Vite). In production, same-origin — no CORS needed.
- Admin accounts: created via `python seed_admin.py` CLI script, no public admin registration

### File Storage
- **Phase 1**: FastAPI `StaticFiles` mount serving `/media/` directory. Uploaded files at `/media/{uuid}.{ext}`. Max size: 50 MB. Allowed types: images (jpg, png, webp), video (mp4, webm).
- **Phase 2**: S3-compatible (Minio / AWS S3). Storage backend abstracted behind a `StorageService` interface — no API changes needed.

---

## Analytics (Admin — `/admin/analytics`)

All metrics are lesson-level (not block-level):

1. **Overview** — total registered students, total enrollments per course
2. **Lesson completion rates** — per lesson: % of enrolled students who completed it
3. **Quiz results** — per quiz block: average score, pass rate, attempts distribution
4. **Drop-off** — lessons ranked by lowest completion rate (identifies where students stop)

---

## Frontend: Student Side

Existing pages (`Dashboard`, `LessonPage`, `Profile`) stay visually as-is. Changes:
- Remove `src/data/courseData.ts` static data
- Replace Zustand mock state with real API calls
- Add `/login` and `/register` pages
- HTTP interceptor for silent JWT refresh
- Explicit "Enroll" button on course page
- "Завершить урок" button at lesson bottom

---

## Frontend: Admin Panel `/admin`

Sections:
- **Programs** — list, create, edit, reorder, publish/unpublish
- **Courses** — nested under program, same operations
- **Modules & Lessons** — nested tree, drag & drop block editor per lesson, lock/unlock modules
- **Students** — list, search, view individual progress, deactivate account
- **Analytics** — charts and tables

Visual style: unified with existing platform (blue gradient, shadcn/ui components, Tailwind).

---

## Out of Scope (for now)

- Multi-tenancy / per-university isolation
- Email notifications
- Certificate generation
- Public API / webhooks
- Mobile app
- AI-generated content or hints
- Intra-lesson (block-level) drop-off analytics

---

## Implementation Order

1. FastAPI project setup + PostgreSQL schema + Alembic migrations
2. Auth endpoints (register, login, refresh, logout, me) + JWT middleware
3. Content CRUD endpoints (programs → courses → modules → lessons → blocks) + reorder
4. File upload endpoint + StaticFiles serving
5. Progress endpoints (enroll, complete lesson, submit practice, submit quiz)
6. Analytics endpoints
7. Student management endpoints (list, view progress, deactivate)
8. Frontend: auth pages (login, register) + JWT interceptor
9. Frontend: replace static data with API calls, add Enroll + Finish lesson buttons
10. Frontend: admin panel — content management (programs/courses/modules/lessons/block editor)
11. Frontend: admin panel — student management
12. Frontend: admin panel — analytics
