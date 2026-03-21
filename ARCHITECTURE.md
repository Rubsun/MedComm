# MedComm Platform - Архитектура

## Обзор

Образовательная платформа для студентов медицинских вузов по теме "Коммуникация врача с пациентом".

**Демо:** https://nxgsquyi66ezk.ok.kimi.link

---

## Структура проекта

```
src/
├── components/
│   └── layout/
│       └── AppLayout.tsx      # Основной layout с sidebar
├── pages/
│   ├── Dashboard.tsx          # Главная страница
│   ├── LessonPage.tsx         # Страница урока (теория + практика)
│   └── Profile.tsx            # Профиль пользователя
├── data/
│   └── courseData.ts          # Данные курса (легко заменить на API)
├── store/
│   └── useStore.ts            # Zustand store (аналог Redux)
├── types/
│   └── index.ts               # TypeScript типы (соответствуют Django моделям)
└── App.tsx                    # Роутинг
```

---

## Django Integration Guide

### 1. API Endpoints (рекомендуемые)

```python
# Django URLs

# Курсы
GET    /api/courses/              # Список курсов
GET    /api/courses/<id>/         # Детали курса с модулями

# Прогресс
GET    /api/progress/             # Прогресс текущего пользователя
POST   /api/progress/lesson/      # Отметить урок как пройденный
POST   /api/progress/exercise/    # Отметить упражнение
POST   /api/progress/quiz/        # Сохранить результат теста

# Пользователь
GET    /api/user/profile/         # Профиль
PUT    /api/user/profile/         # Обновить профиль
GET    /api/user/achievements/    # Достижения
```

### 2. Django Models (соответствие типам)

```python
# models.py

from django.db import models
from django.contrib.auth.models import User

class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    short_description = models.CharField(max_length=500)
    image = models.ImageField(upload_to='courses/')
    level = models.CharField(choices=[
        ('beginner', 'Начальный'),
        ('intermediate', 'Средний'),
        ('advanced', 'Продвинутый')
    ])
    duration = models.CharField(max_length=50)
    total_lessons = models.IntegerField()
    total_exercises = models.IntegerField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField()
    order = models.IntegerField()
    is_locked = models.BooleanField(default=False)
    prerequisites = models.ManyToManyField('self', blank=True)

class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    description = models.TextField()
    order = models.IntegerField()
    type = models.CharField(choices=[
        ('theory', 'Теория'),
        ('practice', 'Практика'),
        ('mixed', 'Смешанный')
    ])
    duration = models.IntegerField()  # минуты
    content = models.JSONField()  # theory blocks
    practice = models.JSONField(null=True, blank=True)  # scenarios
    quiz = models.JSONField(null=True, blank=True)
    resources = models.JSONField(default=list)

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    completed_lessons = models.JSONField(default=list)
    completed_exercises = models.JSONField(default=list)
    quiz_results = models.JSONField(default=list)
    total_progress = models.IntegerField(default=0)
    last_accessed_at = models.DateTimeField(auto_now=True)

class Achievement(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50)
    condition = models.CharField(max_length=255)
    users = models.ManyToManyField(User, through='UserAchievement')

class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)
```

### 3. Интеграция с фронтендом

В `src/data/courseData.ts` замените статичные данные на API запросы:

```typescript
// src/data/api.ts

const API_BASE = '/api';

export const api = {
  // Курсы
  getCourse: (id: string) => 
    fetch(`${API_BASE}/courses/${id}/`).then(r => r.json()),
  
  // Прогресс
  getProgress: () => 
    fetch(`${API_BASE}/progress/`).then(r => r.json()),
  
  completeLesson: (lessonId: string) =>
    fetch(`${API_BASE}/progress/lesson/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId })
    }),
  
  // и т.д.
};
```

В `src/store/useStore.ts` обновите методы для работы с API:

```typescript
completeLesson: async (lessonId) => {
  // Отправляем на сервер
  await api.completeLesson(lessonId);
  
  // Обновляем локальный state
  const { progress } = get();
  if (!progress) return;
  
  set({
    progress: {
      ...progress,
      completedLessons: [...progress.completedLessons, lessonId]
    }
  });
}
```

---

## Добавление нового контента

### 1. Новый модуль

Добавьте в `src/data/courseData.ts`:

```typescript
{
  id: 'module-5',
  courseId: 'medcomm-101',
  title: 'Модуль 5: Новая тема',
  description: 'Описание модуля',
  order: 5,
  isLocked: false,
  lessons: [
    // уроки модуля
  ]
}
```

### 2. Новый урок

```typescript
{
  id: 'lesson-5-1',
  moduleId: 'module-5',
  title: '5.1 Название урока',
  description: 'Описание',
  order: 1,
  type: 'mixed',
  duration: 30,
  content: {
    theory: [
      {
        id: 'block-1',
        type: 'text',
        title: 'Заголовок',
        content: 'Текст урока...'
      }
    ],
    practice: {
      id: 'practice-5-1',
      title: 'Практика',
      description: '...',
      instructions: '...',
      scenarios: [
        // сценарии
      ]
    }
  },
  resources: []
}
```

### 3. Новый сценарий (практика)

```typescript
{
  id: 'scenario-1',
  title: 'Название сценария',
  patient: {
    name: 'Имя',
    age: 30,
    gender: 'male',
    temperament: 'choleric',
    complaint: 'Жалоба',
    history: 'История',
    behavior: 'Поведение'
  },
  situation: 'Описание ситуации',
  goal: 'Цель',
  options: [
    {
      id: 'opt-1',
      text: 'Вариант 1',
      isCorrect: true,
      feedback: 'Правильно!'
    },
    {
      id: 'opt-2',
      text: 'Вариант 2',
      isCorrect: false,
      feedback: 'Неправильно...'
    }
  ],
  correctOptionId: 'opt-1',
  explanation: 'Объяснение',
  hints: ['Подсказка 1', 'Подсказка 2']
}
```

---

## Функционал платформы

### Реализовано:

- ✅ **Авторизация** (демо-режим)
- ✅ **Структура курса** (модули → уроки)
- ✅ **Теоретический контент** (текст, видео, инфографика)
- ✅ **Практические сценарии** (интерактивные кейсы)
- ✅ **Прогресс обучения** (отслеживание завершенных уроков)
- ✅ **Навигация** (следующий/предыдущий урок)
- ✅ **Профиль студента** (статистика)
- ✅ **Достижения** (система наград)
- ✅ **Адаптивный дизайн** (мобильная версия)

### Для интеграции с Django:

- 🔄 Заменить `courseData.ts` на API запросы
- 🔄 Добавить аутентификацию JWT
- 🔄 Добавить серверную валидацию
- 🔄 Добавить админ-панель для управления контентом

---

## Технологии

- **React 18** + TypeScript
- **Vite** (сборка)
- **Tailwind CSS** (стили)
- **shadcn/ui** (компоненты)
- **Zustand** (state management)
- **React Router** (навигация)

---

## Запуск локально

```bash
npm install
npm run dev
```

## Сборка для production

```bash
npm run build
```

Статические файлы будут в папке `dist/`.
