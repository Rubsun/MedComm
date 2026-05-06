"""general tests (входные/итоговые) + seed 3 entry-тестов

Revision ID: 2026d01gentest
Revises: 2026c01modpub
"""
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "2026d01gentest"
down_revision: Union[str, None] = "2026c01modpub"
branch_labels = None
depends_on = None


SEED_TESTS = [
    {
        "slug": "empathy-boyko",
        "kind": "entry",
        "title": "Диагностика эмпатии",
        "method": "Методика В.В. Бойко",
        "description": "36 утверждений, ответы «Да/Нет». Определяет ваш текущий уровень эмпатии по шести каналам.",
        "question_type": "yesno",
        "duration": "8–10 мин",
        "likert_labels": None,
        "scales": [
            {"key": "rational",    "name": "Рациональный канал",   "yes": [1, 7, 14, 22, 29, 33]},
            {"key": "emotional",   "name": "Эмоциональный канал",  "yes": [3, 13, 20, 24, 32, 36]},
            {"key": "intuitive",   "name": "Интуитивный канал",    "yes": [5, 9, 11, 16, 31, 35]},
            {"key": "attitudes",   "name": "Установки эмпатии",    "yes": [4, 18, 26], "no": [8, 15, 34]},
            {"key": "penetration", "name": "Проникающая способность", "no": [2, 6, 12, 21, 25, 30]},
            {"key": "identif",     "name": "Идентификация",        "yes": [27], "no": [17, 19, 28, 10, 23]},
        ],
        "interpretations": [
            {"min": 0, "max": 12, "level": "очень низкий", "short": "Очень низкий уровень эмпатии",
             "text": "В данный момент вам, возможно, трудно спонтанно настраиваться на эмоциональное состояние другого человека. Вы не одиноки: более половины студентов-медиков имеют низкие показатели эмпатии. Хорошая новость — эмпатия не врождённая черта, а навык, который можно целенаправленно развивать."},
            {"min": 13, "max": 18, "level": "низкий", "short": "Низкий уровень",
             "text": "Эмпатические способности пока сформированы недостаточно. Возможно, в общении с пациентами вы опираетесь прежде всего на логику. У вас есть база, на которую можно опереться — курс поможет нарастить эмпатическую «мышцу»."},
            {"min": 19, "max": 24, "level": "средний", "short": "Средний уровень",
             "text": "Вы обладаете базовой способностью к сопереживанию. Это хороший фундамент для врача. В каких-то каналах эмпатии показатели выше, в других — ниже. Курс затронет все аспекты и поможет сделать навык устойчивым в стрессовых ситуациях."},
            {"min": 25, "max": 30, "level": "высокий", "short": "Высокий уровень",
             "text": "Отличный результат! У вас хорошо развита способность понимать переживания пациентов. Такой уровень эмпатии — ценный ресурс. Даже высокий уровень нуждается в огранке: важно научиться управлять эмпатией, чтобы она не вела к выгоранию."},
            {"min": 31, "max": 36, "level": "очень высокий", "short": "Очень высокий уровень",
             "text": "Вы глубоко чувствуете состояние других людей — это и дар, и зона риска. Высокая эмпатия способна вызывать сильный эмоциональный резонанс. Курс уделит особое внимание техникам эмоциональной регуляции и границам."},
        ],
        "questions": [
            "Я часто читаю художественные или медицинские рассказы о людях и могу представить себя на их месте.",
            "Мне трудно понять, почему некоторые пациенты плачут без видимой причины.",
            "Когда я вижу страдающего человека, у меня самого портится настроение.",
            "В конфликтной ситуации я стараюсь понять позицию другого, даже если он не прав.",
            "Я могу по выражению лица догадаться, что пациент что-то недоговаривает.",
            "Мне кажется, что большинство людей преувеличивают свои болезни.",
            "Я легко могу поставить себя на место другого человека.",
            "Разговор на эмоциональные темы обычно вызывает у меня неловкость.",
            "Я часто ловлю себя на том, что машинально копирую позу собеседника.",
            "Я считаю, что врач должен быть прежде всего рациональным, а не чувствительным.",
            "Я быстро улавливаю малейшие изменения в настроении пациента.",
            "Чужие проблемы обычно не нарушают мой душевный покой.",
            "Когда я вижу, что пациенту больно, я невольно морщусь.",
            "Я могу представить, что чувствует пожилой человек, потерявший супруга.",
            "Чтобы понять пациента, достаточно выслушать его жалобы, не вникая в эмоции.",
            "Я часто замечаю, что люди говорят одно, а чувствуют другое.",
            "Если пациент начинает плакать, я теряюсь и не знаю, что сказать.",
            "Я умею настроиться на «волну» собеседника.",
            "Я предпочитаю дистанцироваться от эмоциональных проблем пациентов.",
            "Я часто «заражаюсь» чужим настроением.",
            "Заметить, что человеку некомфортно, я могу только по прямым жалобам.",
            "Я хорошо понимаю, что чувствует пациент, которому сообщили плохой диагноз.",
            "Я считаю, что эмпатия мешает принимать объективные решения.",
            "Если коллега расстроен, я интуитивно снижаю тон и становлюсь мягче.",
            "Меня раздражают пациенты, которые постоянно жалуются на жизнь.",
            "Я способен сопереживать даже незнакомому человеку.",
            "Я склонен анализировать причины поведения пациента, а не просто осуждать.",
            "Мне сложно работать с пациентом, который вызывает у меня личную неприязнь.",
            "Я могу представить, как выглядит мир глазами пациента с деменцией.",
            "Я стараюсь не принимать близко к сердцу переживания пациентов.",
            "Я хорошо считываю невербальные сигналы (жесты, мимику, интонацию).",
            "Эмоциональный разговор с пациентом может выбить меня из колеи на весь день.",
            "Я могу представить, что чувствует человек, испытывающий сильную боль.",
            "Я считаю, что врачу лучше сохранять нейтралитет и не проявлять сочувствия.",
            "Я легко улавливаю атмосферу в палате или кабинете.",
            "Иногда я ловлю себя на мысли, что машинально улыбаюсь в ответ на улыбку пациента.",
        ],
    },
    {
        "slug": "anxiety-spielberger",
        "kind": "entry",
        "title": "Шкала личностной тревожности",
        "method": "Спилбергер–Ханин",
        "description": "20 утверждений, шкала от 1 до 4. Показывает, насколько вы склонны воспринимать ситуации как стрессовые.",
        "question_type": "likert4",
        "duration": "5–7 мин",
        "likert_labels": ["Почти никогда", "Иногда", "Часто", "Почти всегда"],
        "scales": [
            {"key": "direct",  "name": "Прямые вопросы",  "direct":  [2, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19]},
            {"key": "reverse", "name": "Обратные вопросы", "reverse": [1, 4, 6, 9, 11, 14, 16, 18, 20]},
        ],
        "interpretations": [
            {"min": 0, "max": 30, "level": "низкая", "short": "Низкая тревожность",
             "text": "В целом вы спокойно воспринимаете большинство жизненных ситуаций. Для врача такое качество полезно — помогает сохранять ясность мышления в напряжённые моменты. Небольшая доля ситуативной тревоги нормальна и даже продуктивна. В курсе мы будем учиться управлять тревогой, превращая её из помехи в союзника."},
            {"min": 31, "max": 45, "level": "умеренная", "short": "Умеренная тревожность",
             "text": "Средний, наиболее распространённый уровень. Вы реагируете на стрессовые факторы напряжённостью, но в большинстве случаев способны с ней справляться. Курс даст конкретные приёмы снижения тревоги в момент общения и тренировку на кейсах, что уменьшит страх перед реальными ситуациями."},
            {"min": 46, "max": 80, "level": "высокая", "short": "Высокая тревожность",
             "text": "Вы склонны воспринимать широкий круг ситуаций как угрожающие. Высокая тревожность способна мешать установлению контакта с пациентом. Это не приговор, а особенность, с которой можно работать — курс содержит специальные техники снижения тревоги и повышения уверенности."},
        ],
        "questions": [
            "Я испытываю удовольствие.",
            "Я быстро устаю.",
            "Я легко могу заплакать.",
            "Я хотел бы быть таким же удачливым, как другие.",
            "Я нервничаю из-за вещей, которые могли бы сложиться иначе.",
            "Я чувствую себя в безопасности.",
            "Я стараюсь избегать трудностей и критических ситуаций.",
            "У меня бывает хандра.",
            "Я уравновешенный человек.",
            "Меня охватывает сильное беспокойство, когда я думаю о своих делах и заботах.",
            "Я доволен собой.",
            "Я склонен принимать всё близко к сердцу.",
            "Мне не хватает уверенности в себе.",
            "Я чувствую себя отдохнувшим.",
            "Я стараюсь не вовлекаться в эмоциональные разговоры.",
            "Я спокоен, когда нахожусь в ожидании результатов анализов.",
            "Меня беспокоят возможные неудачи.",
            "Я хорошо сплю.",
            "Я чувствую, что не справлюсь с трудной беседой.",
            "Я доволен своим положением дел.",
        ],
    },
    {
        "slug": "self-comm",
        "kind": "entry",
        "title": "Самооценка коммуникативных навыков",
        "method": "Авторская методика",
        "description": "10 утверждений, шкала от 1 до 10. Ваш собственный взгляд на свои умения.",
        "question_type": "scale10",
        "duration": "3–5 мин",
        "likert_labels": None,
        "scales": [
            {"key": "main", "name": "Средний балл", "avg": True, "inverse": [5, 8]},
        ],
        "interpretations": [
            {"min": 1, "max": 3.99, "level": "низкая", "short": "Низкая самооценка",
             "text": "Вы ощущаете значительную неуверенность при общении с пациентами. Это объяснимо для студента, у которого ещё недостаточно практики. Важно, что вы честно признаёте зоны для роста — это первый шаг к их развитию. Мы разберём конкретные фразы и алгоритмы для типичных ситуаций."},
            {"min": 4, "max": 7.99, "level": "средняя", "short": "Средняя самооценка",
             "text": "Вы чувствуете себя относительно уверенно в одних аспектах общения и менее уверенно в других. Это нормальное состояние студента: опыт ещё нарабатывается. Курс систематизирует знания, добавит недостающие техники и за счёт практики выровняет уверенность по всем направлениям."},
            {"min": 8, "max": 10, "level": "высокая", "short": "Высокая самооценка",
             "text": "Вы ощущаете себя вполне подготовленным к общению с пациентами. Это отличная установка, которая способствует успешной коммуникации. Даже уверенный коммуникатор встретит нестандартные ситуации — мы предложим продвинутые техники и сценарии, которые расширят ваш арсенал."},
        ],
        "questions": [
            "Я чувствую себя уверенно, когда начинаю разговор с незнакомым пациентом.",
            "Я умею слушать, не перебивая, даже когда пациент говорит много лишнего.",
            "Я могу спокойно объяснить сложный диагноз так, чтобы пациент понял.",
            "Я знаю, как реагировать, если пациент начинает плакать или кричать.",
            "Я опасаюсь, что скажу что-то не то и пациент пожалуется на меня.",
            "Мне легко даётся поддерживать зрительный контакт во время беседы.",
            "Я способен корректно завершить разговор, если он затянулся.",
            "При общении с пациентом я ловлю себя на мысли, что не знаю, куда деть руки.",
            "Я могу спросить пациента о его страхах, не боясь обидеть.",
            "Я считаю свой уровень подготовки по коммуникации достаточным для клинической практики.",
        ],
    },
]


def upgrade() -> None:
    op.create_table(
        "general_tests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("method", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("description", sa.String(length=2000), nullable=False, server_default=""),
        sa.Column("question_type", sa.String(length=16), nullable=False),
        sa.Column("duration", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("likert_labels", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("scales", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("interpretations", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_general_tests_slug", "general_tests", ["slug"], unique=True)

    op.create_table(
        "general_test_questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("test_id", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=2000), nullable=False),
        sa.ForeignKeyConstraint(["test_id"], ["general_tests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("test_id", "sort_order"),
    )
    op.create_index("ix_general_test_questions_test_id", "general_test_questions", ["test_id"])

    op.create_table(
        "general_test_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("test_id", sa.Integer(), nullable=False),
        sa.Column("answers", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("score", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("interpretation", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["test_id"], ["general_tests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "test_id"),
    )
    op.create_index("ix_general_test_attempts_user_id", "general_test_attempts", ["user_id"])
    op.create_index("ix_general_test_attempts_test_id", "general_test_attempts", ["test_id"])

    # ── seed 3 entry-тестов из index.html ─────────────────────────────
    bind = op.get_bind()
    tests_table = sa.table(
        "general_tests",
        sa.column("id", sa.Integer),
        sa.column("slug", sa.String),
        sa.column("kind", sa.String),
        sa.column("title", sa.String),
        sa.column("method", sa.String),
        sa.column("description", sa.String),
        sa.column("question_type", sa.String),
        sa.column("duration", sa.String),
        sa.column("likert_labels", postgresql.JSONB),
        sa.column("scales", postgresql.JSONB),
        sa.column("interpretations", postgresql.JSONB),
        sa.column("is_published", sa.Boolean),
        sa.column("sort_order", sa.Integer),
    )
    questions_table = sa.table(
        "general_test_questions",
        sa.column("test_id", sa.Integer),
        sa.column("sort_order", sa.Integer),
        sa.column("text", sa.String),
    )

    for sort_order, t in enumerate(SEED_TESTS):
        result = bind.execute(
            tests_table.insert()
            .values(
                slug=t["slug"],
                kind=t["kind"],
                title=t["title"],
                method=t["method"],
                description=t["description"],
                question_type=t["question_type"],
                duration=t["duration"],
                likert_labels=t["likert_labels"],
                scales=t["scales"],
                interpretations=t["interpretations"],
                is_published=True,
                sort_order=sort_order,
            )
            .returning(tests_table.c.id)
        )
        new_id = result.scalar()
        bind.execute(
            questions_table.insert(),
            [{"test_id": new_id, "sort_order": i, "text": q} for i, q in enumerate(t["questions"])],
        )


def downgrade() -> None:
    op.drop_index("ix_general_test_attempts_test_id", table_name="general_test_attempts")
    op.drop_index("ix_general_test_attempts_user_id", table_name="general_test_attempts")
    op.drop_table("general_test_attempts")
    op.drop_index("ix_general_test_questions_test_id", table_name="general_test_questions")
    op.drop_table("general_test_questions")
    op.drop_index("ix_general_tests_slug", table_name="general_tests")
    op.drop_table("general_tests")
