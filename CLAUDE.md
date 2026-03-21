# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MedComm Platform — an educational web app for medical university students on the topic of doctor-patient communication. Currently a frontend-only demo (no backend), designed for future Django integration.

## Commands

All commands run from the `app/` directory:

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Type-check (tsc -b) + production build → dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

## Architecture

### Tech Stack

- **React 19** + TypeScript, built with **Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives in `src/components/ui/`)
- **Zustand** (persisted store via `localStorage` key `medcomm-storage`)
- **React Router v7** (nested routes under `AppLayout`)

### Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Login page, protected route guard, root router |
| `src/store/useStore.ts` | Single Zustand store — all app state (auth, progress, navigation, UI, practice) |
| `src/types/index.ts` | All TypeScript interfaces; designed to mirror Django models |
| `src/data/courseData.ts` | Static course data (the only place to add/edit content until Django backend exists) |
| `src/pages/LessonPage.tsx` | Lesson view with theory/practice/resources tabs |
| `src/components/layout/AppLayout.tsx` | Sidebar + outlet layout for authenticated pages |

### Routing

```
/login              → LoginPage (demo: click "Войти" without credentials)
/                   → Dashboard (protected)
/lesson             → LessonPage (protected, uses store's currentLesson)
/profile            → Profile
/achievements       → Profile (same component)
```

### State Management Pattern

`useStore` is the single source of truth. It persists `user`, `isAuthenticated`, `progress`, and `achievements` to localStorage. Navigation state (`currentCourse`, `currentModule`, `currentLesson`) is not persisted — it's set at runtime by clicking lessons in the sidebar.

### Content Data Model

Course content lives in `src/data/courseData.ts` as static objects. The hierarchy is:
`Course → Module[] → Lesson[] → { theory: TheoryBlock[], practice: PracticeBlock? }`

Practice scenarios follow the `Scenario` type: a `PatientProfile`, a `situation`, multiple `ScenarioOption[]` (with `isCorrect` flag), and an `explanation`.

### Django Integration (planned)

When connecting a backend, replace `courseData.ts` with API calls at `/api/courses/<id>/`, and update the Zustand methods to call `POST /api/progress/lesson/` etc. after updating local state. See `ARCHITECTURE.md` for full endpoint specs and Django model definitions.
