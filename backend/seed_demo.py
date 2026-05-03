#!/usr/bin/env python
"""Idempotent demo seed.

Заполняет БД минимальным набором контента для показательной работы платформы:
- Одна программа «Коммуникация врача с пациентом»
- Два курса с модулями и уроками
- Один полностью наполненный урок (text + image + practice + quiz)
- Шесть достижений разных тиров

Запуск:
    python -m backend.seed_demo
или (внутри Docker):
    docker compose exec backend python -m backend.seed_demo
"""

import asyncio

from sqlalchemy import select

from backend.database import AsyncSessionLocal
from backend.models import (
    Achievement,
    Course,
    Lesson,
    LessonBlock,
    Module,
    Program,
)


async def get_or_create(session, model, *, defaults=None, **filters):
    res = await session.execute(select(model).filter_by(**filters))
    obj = res.scalar_one_or_none()
    if obj:
        return obj, False
    payload = {**filters, **(defaults or {})}
    obj = model(**payload)
    session.add(obj)
    await session.flush()
    return obj, True


async def seed_content(session):
    program, _ = await get_or_create(
        session,
        Program,
        slug="demo-doctor-communication",
        defaults={
            "title": "Коммуникация врача с пациентом",
            "description": "Базовая программа по эмпатичной и эффективной коммуникации.",
            "is_published": True,
            "sort_order": 0,
        },
    )

    course_basics, _ = await get_or_create(
        session,
        Course,
        slug="demo-course-basics",
        defaults={
            "program_id": program.id,
            "title": "Основы клинической коммуникации",
            "description": "Структура консультации, активное слушание, эмпатия.",
            "is_published": True,
            "sort_order": 0,
        },
    )

    course_difficult, _ = await get_or_create(
        session,
        Course,
        slug="demo-course-difficult",
        defaults={
            "program_id": program.id,
            "title": "Сложные разговоры",
            "description": "Сообщение плохих новостей, конфликтные ситуации, отказ от лечения.",
            "is_published": True,
            "sort_order": 1,
        },
    )

    # --- Модули и уроки для course_basics ---
    module_intro, _ = await get_or_create(
        session,
        Module,
        slug="demo-mod-intro",
        defaults={
            "course_id": course_basics.id,
            "title": "Введение",
            "description": "Зачем врачу учиться коммуникации.",
            "is_locked": False,
            "is_published": True,
            "sort_order": 0,
        },
    )

    module_consultation, _ = await get_or_create(
        session,
        Module,
        slug="demo-mod-consultation",
        defaults={
            "course_id": course_basics.id,
            "title": "Структура консультации",
            "description": "Модель Calgary–Cambridge: разделы и переходы.",
            "is_locked": False,
            "is_published": True,
            "sort_order": 1,
        },
    )

    module_empathy, _ = await get_or_create(
        session,
        Module,
        slug="demo-mod-empathy",
        defaults={
            "course_id": course_basics.id,
            "title": "Эмпатия и активное слушание",
            "description": "NURSE-фразы, парафраз, открытые вопросы.",
            "is_locked": False,
            "is_published": True,
            "sort_order": 2,
        },
    )

    # Уроки модуля «Введение»
    lesson_why, lesson_why_created = await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-why",
        defaults={
            "module_id": module_intro.id,
            "title": "Почему коммуникация — это навык",
            "description": "Доказательная база и клинические эффекты.",
            "type": "theory",
            "duration_min": 8,
            "is_published": True,
            "sort_order": 0,
        },
    )

    lesson_skills_quiz, _ = await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-self-check",
        defaults={
            "module_id": module_intro.id,
            "title": "Что я уже умею? — самопроверка",
            "description": "Короткий тест перед курсом.",
            "type": "mixed",
            "duration_min": 5,
            "is_published": True,
            "sort_order": 1,
        },
    )

    # Уроки модуля «Структура консультации»
    await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-opening",
        defaults={
            "module_id": module_consultation.id,
            "title": "Открытие консультации",
            "type": "theory",
            "duration_min": 10,
            "is_published": True,
            "sort_order": 0,
        },
    )
    await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-gathering",
        defaults={
            "module_id": module_consultation.id,
            "title": "Сбор информации",
            "type": "theory",
            "duration_min": 12,
            "is_published": True,
            "sort_order": 1,
        },
    )
    await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-closing",
        defaults={
            "module_id": module_consultation.id,
            "title": "Завершение консультации — практика",
            "type": "practice",
            "duration_min": 10,
            "is_published": True,
            "sort_order": 2,
        },
    )

    # Уроки модуля «Эмпатия и активное слушание»
    await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-nurse",
        defaults={
            "module_id": module_empathy.id,
            "title": "NURSE-фразы для эмпатии",
            "type": "theory",
            "duration_min": 9,
            "is_published": True,
            "sort_order": 0,
        },
    )
    await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-open-questions",
        defaults={
            "module_id": module_empathy.id,
            "title": "Открытые вопросы — практика",
            "type": "practice",
            "duration_min": 10,
            "is_published": True,
            "sort_order": 1,
        },
    )

    # Один модуль / урок для course_difficult чтобы было видно второй курс
    module_bad_news, _ = await get_or_create(
        session,
        Module,
        slug="demo-mod-bad-news",
        defaults={
            "course_id": course_difficult.id,
            "title": "Сообщение плохих новостей",
            "description": "Протокол SPIKES.",
            "is_locked": False,
            "is_published": True,
            "sort_order": 0,
        },
    )
    await get_or_create(
        session,
        Lesson,
        slug="demo-lesson-spikes",
        defaults={
            "module_id": module_bad_news.id,
            "title": "Протокол SPIKES",
            "type": "theory",
            "duration_min": 14,
            "is_published": True,
            "sort_order": 0,
        },
    )

    # --- Блоки для первого урока, только если он только что создан ---
    if lesson_why_created:
        session.add_all(
            [
                LessonBlock(
                    lesson_id=lesson_why.id,
                    type="text",
                    sort_order=0,
                    data={
                        "html": (
                            "<h2>Зачем учиться разговаривать с пациентом?</h2>"
                            "<p>Качественная коммуникация повышает приверженность лечению,"
                            " снижает количество жалоб и улучшает диагностическую точность."
                            " Это <strong>навык</strong>, а не врождённый талант — и его можно"
                            " тренировать так же, как пальпацию или аускультацию.</p>"
                            "<ul>"
                            "<li>Лучшая собранная анамнестическая информация</li>"
                            "<li>Меньше конфликтов и жалоб</li>"
                            "<li>Выше удовлетворённость и приверженность</li>"
                            "</ul>"
                        )
                    },
                ),
                LessonBlock(
                    lesson_id=lesson_why.id,
                    type="practice",
                    sort_order=1,
                    data={
                        "situation": (
                            "Пациент приходит с жалобой на головную боль и сразу"
                            " говорит: «Доктор, я начитался в интернете и думаю, что"
                            " у меня опухоль мозга». Какая первая реакция уместна?"
                        ),
                        "options": [
                            {
                                "id": "a",
                                "text": "Сразу опровергнуть: «Это совсем не похоже на опухоль».",
                                "is_correct": False,
                                "feedback": (
                                    "Слишком рано: вы ещё не выяснили, что именно беспокоит"
                                    " пациента, и закрываете эмоцию."
                                ),
                            },
                            {
                                "id": "b",
                                "text": (
                                    "Признать тревогу и пригласить рассказать подробнее:"
                                    " «Я слышу, что вы сильно встревожены. Расскажите,"
                                    " что именно вас беспокоит сильнее всего?»"
                                ),
                                "is_correct": True,
                                "feedback": (
                                    "Точно: вы валидировали эмоцию (NURSE — Naming) и открыли"
                                    " пространство для рассказа."
                                ),
                            },
                            {
                                "id": "c",
                                "text": "Назначить МРТ, чтобы успокоить.",
                                "is_correct": False,
                                "feedback": (
                                    "Гипердиагностика и уход от разговора — это не решает"
                                    " тревогу пациента."
                                ),
                            },
                        ],
                        "explanation": (
                            "Эмпатичный отклик начинается с признания чувств,"
                            " а не с медицинских аргументов."
                        ),
                    },
                ),
                LessonBlock(
                    lesson_id=lesson_why.id,
                    type="quiz",
                    sort_order=2,
                    data={
                        "passing_score": 2,
                        "questions": [
                            {
                                "id": "q1",
                                "text": (
                                    "Что НЕ относится к доказанным эффектам качественной"
                                    " коммуникации врач–пациент?"
                                ),
                                "options": [
                                    {"id": "a", "text": "Снижение количества жалоб", "is_correct": False},
                                    {"id": "b", "text": "Повышение приверженности", "is_correct": False},
                                    {
                                        "id": "c",
                                        "text": "Гарантированное излечение всех болезней",
                                        "is_correct": True,
                                    },
                                ],
                            },
                            {
                                "id": "q2",
                                "text": "Коммуникация — это…",
                                "options": [
                                    {
                                        "id": "a",
                                        "text": "Врождённый талант, тренировать бессмысленно",
                                        "is_correct": False,
                                    },
                                    {
                                        "id": "b",
                                        "text": "Навык, который тренируется как любой клинический",
                                        "is_correct": True,
                                    },
                                ],
                            },
                            {
                                "id": "q3",
                                "text": "Первая реакция на тревогу пациента — это…",
                                "options": [
                                    {"id": "a", "text": "Опровержение", "is_correct": False},
                                    {"id": "b", "text": "Признание чувств", "is_correct": True},
                                    {"id": "c", "text": "Назначение анализов", "is_correct": False},
                                ],
                            },
                        ],
                    },
                ),
            ]
        )

    # Блоки для урока самопроверки
    res = await session.execute(
        select(LessonBlock).where(LessonBlock.lesson_id == lesson_skills_quiz.id)
    )
    if not res.scalars().first():
        session.add(
            LessonBlock(
                lesson_id=lesson_skills_quiz.id,
                type="quiz",
                sort_order=0,
                data={
                    "passing_score": 1,
                    "questions": [
                        {
                            "id": "q1",
                            "text": "Если пациент молчит после вашего вопроса, лучше…",
                            "options": [
                                {
                                    "id": "a",
                                    "text": "Подождать и дать время — пауза часто продуктивна",
                                    "is_correct": True,
                                },
                                {
                                    "id": "b",
                                    "text": "Сразу перефразировать или задать новый вопрос",
                                    "is_correct": False,
                                },
                            ],
                        }
                    ],
                },
            )
        )


ACHIEVEMENTS_SEED = [
    dict(
        title="Первый шаг",
        description="Прошёл первый урок",
        icon="award",
        tier="bronze",
        metric="lessons_completed",
        op=">=",
        threshold=1,
        xp=50,
        sort_order=0,
    ),
    dict(
        title="Усердный ученик",
        description="Прошёл 10 уроков",
        icon="grad",
        tier="silver",
        metric="lessons_completed",
        op=">=",
        threshold=10,
        xp=200,
        sort_order=1,
    ),
    dict(
        title="Марафонец",
        description="Прошёл 50 уроков",
        icon="trophy",
        tier="gold",
        metric="lessons_completed",
        op=">=",
        threshold=50,
        xp=600,
        sort_order=2,
    ),
    dict(
        title="3 дня подряд",
        description="Учишься три дня подряд",
        icon="flame",
        tier="bronze",
        metric="streak_days",
        op=">=",
        threshold=3,
        xp=80,
        sort_order=3,
    ),
    dict(
        title="Неделя в строю",
        description="7 дней подряд активности",
        icon="flame",
        tier="silver",
        metric="streak_days",
        op=">=",
        threshold=7,
        xp=200,
        sort_order=4,
    ),
    dict(
        title="Идеальный тест",
        description="Сдал тест на максимум",
        icon="target",
        tier="silver",
        metric="perfect_quizzes",
        op=">=",
        threshold=1,
        xp=120,
        sort_order=5,
    ),
    dict(
        title="Курс закрыт",
        description="Полностью завершил курс",
        icon="cert",
        tier="gold",
        metric="courses_completed",
        op=">=",
        threshold=1,
        xp=400,
        sort_order=6,
    ),
]


async def seed_achievements(session):
    for spec in ACHIEVEMENTS_SEED:
        await get_or_create(
            session,
            Achievement,
            title=spec["title"],
            metric=spec["metric"],
            threshold=spec["threshold"],
            defaults={
                "description": spec.get("description", ""),
                "icon": spec.get("icon", "trophy"),
                "tier": spec.get("tier", "bronze"),
                "op": spec.get("op", ">="),
                "xp": spec.get("xp", 0),
                "is_published": True,
                "sort_order": spec.get("sort_order", 0),
            },
        )


async def main():
    async with AsyncSessionLocal() as session:
        await seed_content(session)
        await seed_achievements(session)
        await session.commit()
    print("Demo data seeded.")


if __name__ == "__main__":
    asyncio.run(main())
