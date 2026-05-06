import { Avatar, Badge, Button, Card, Icon, ToastViewport, useToasts, type IconName } from '@/components/medcomm';

const CONTACT_EMAIL = 'avnudga1@yandex.ru';

interface Principle {
  icon: IconName;
  title: string;
  body: string;
  stats?: { value: string; label: string }[];
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  tags: string[];
}

const PRINCIPLES: Principle[] = [
  {
    icon: 'chart',
    title: 'Научность и факты',
    body: 'Каждый кейс и комментарий опирается на исследования. Мы не даём «волшебных таблеток» — только проверенные алгоритмы.',
    stats: [
      { value: '87%', label: 'преподавателей за обучение коммуникации с 1 курса' },
      { value: '53%', label: 'врачей испытывают стресс из-за дефицита коммуникации' },
    ],
  },
  {
    icon: 'heart',
    title: 'Безопасная среда',
    body: 'Пространство, где можно ошибаться без последствий для реального пациента. Развёрнутая обратная связь по каждому шагу — почему один ответ эффективнее другого.',
  },
  {
    icon: 'layers',
    title: 'Пластичность и разнообразие',
    body: 'Универсальной схемы общения не существует. Сценарии для разных психотипов — от «агрессивного родственника» до «тревожного больного» с хроническим заболеванием.',
  },
  {
    icon: 'msg',
    title: 'Открытость к обратной связи',
    body: 'Платформа дорабатывается по результатам пилотного тестирования с 40 студентами и ординаторами. Каждое замечание делает кейсы точнее.',
  },
  {
    icon: 'checkCircle',
    title: 'Практическая ценность',
    body: 'Никакой «воды» — только конкретные фразы, техники активного слушания, алгоритмы выхода из конфликта и чек-листы для самопроверки. Применимо завтра на клинической практике.',
  },
];

const TEAM: TeamMember[] = [
  {
    name: 'Дарина Нудьга',
    role: 'Лидер проекта',
    bio: 'Победитель конкурса «Большая перемена», командир студенческого медотряда «Алмаз». Лично столкнулась с проблемой коммуникации на практике и вдохновила команду на создание решения.',
    tags: ['Студент-медик', 'Лидер'],
  },
  {
    name: 'Алёна Додона',
    role: 'Архитектор кейсов, методолог',
    bio: 'Сертифицированный коуч (ICF), эксперт по развитию коммуникаций. Превращает клинические ситуации в разветвлённые интерактивные сценарии с глубокой обратной связью.',
    tags: ['ICF-коуч', 'Методология'],
  },
  {
    name: 'Максим Нудьга',
    role: 'Разработчик платформы',
    bio: 'Backend-разработчик с коммерческим опытом. Создал логику ветвления кейсов, интерфейс и обеспечил стабильную работу платформы на сервере.',
    tags: ['Backend', 'Платформа'],
  },
  {
    name: 'Мария Щукина',
    role: 'Эксперт, профессор кафедры психологии',
    bio: 'Профессор кафедры психологии Центра им. Алмазова. Проверяет медицинскую и психологическую достоверность каждого кейса — учим правильному, а не просто «красивому» общению.',
    tags: ['Центр им. Алмазова', 'Клиническая психология'],
  },
];

export default function AboutPage() {
  const { toasts, push: toast, dismiss } = useToasts();

  const handleContact = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      toast({ message: `${CONTACT_EMAIL} скопирован`, icon: 'check' });
    } catch {
      toast({ message: `Напишите нам: ${CONTACT_EMAIL}`, icon: 'mail' });
    }
    window.location.href = `mailto:${CONTACT_EMAIL}`;
  };

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: 1180, margin: '0 auto' }}>
      <div
        className="anim-up"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: 32,
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--teal-50) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 760 }}>
          <Badge tone="teal" size="sm" icon="info" style={{ marginBottom: 14 }}>
            О проекте
          </Badge>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.02em' }}>
            Доктор, поговорим?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.65, marginBottom: 14 }}>
            Мы — команда студентов-медиков, психологов и IT-разработчиков из Санкт-Петербурга и Сириуса.
            Проект родился из личного опыта: будучи студентами-медиками, мы столкнулись с тем, что
            системной подготовке к живому диалогу с пациентом в университете уделяется критически
            мало времени.
          </p>
          <p style={{ fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.65, marginBottom: 0 }}>
            Это порождает неуверенность, тревожность и страх перед первым самостоятельным контактом.
            Мы создаём веб-платформу, где можно безопасно «проговорить» сложный сценарий, получить
            разбор ошибок и подготовиться к реальной практике.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
            <Badge tone="neutral" size="md" icon="grad">
              Институт мед. образования им. В.А. Алмазова
            </Badge>
            <Badge tone="neutral" size="md" icon="checkCircle">
              Рецензирование экспертами
            </Badge>
            <Badge tone="neutral" size="md" icon="users">
              Пилот: 40 студентов и ординаторов
            </Badge>
          </div>
        </div>
      </div>

      <div
        className="anim-up"
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
          borderRadius: 18,
          padding: 32,
          color: 'white',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(45, 212, 191, 0.18)',
            filter: 'blur(40px)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 820 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              fontSize: 12,
              opacity: 0.85,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Icon name="target" size={13} /> Наша миссия
          </div>
          <h2
            style={{
              color: 'white',
              fontSize: 22,
              lineHeight: 1.35,
              marginBottom: 14,
              fontFamily: 'Inter Tight',
              fontWeight: 600,
            }}
          >
            Сделать эффективную, эмпатичную и этичную коммуникацию неотъемлемой частью
            профессиональной подготовки каждого врача.
          </h2>
          <p style={{ fontSize: 14, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>
            Мы показываем, что правильно выстроенный диалог — не «вежливость», а конкретный
            диагностический и лечебный инструмент: повышает приверженность терапии, снижает риск
            конфликтов и профессионального выгорания.
          </p>
        </div>
      </div>

      <div
        style={{
          marginBottom: 14,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Наши принципы</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
            Пять оснований, на которых строится платформа
          </p>
        </div>
        <span
          className="mono"
          style={{ fontSize: 11.5, color: 'var(--ink-400)', letterSpacing: '0.06em' }}
        >
          05 / ПРИНЦИПЫ
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {PRINCIPLES.map((p, i) => (
          <Card
            key={i}
            padding={20}
            style={{
              gridColumn: i < 2 ? 'span 3' : 'span 2',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: 'var(--teal-50)',
                  color: 'var(--teal-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={p.icon} size={18} />
              </div>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-400)', letterSpacing: '0.04em' }}
              >
                0{i + 1}
              </span>
            </div>
            <h3 style={{ fontSize: 15, marginBottom: 0 }}>{p.title}</h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--ink-600)',
                lineHeight: 1.55,
                margin: 0,
                flex: 1,
              }}
            >
              {p.body}
            </p>

            {p.stats && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  paddingTop: 14,
                  marginTop: 4,
                  borderTop: '1px solid var(--line-soft)',
                }}
              >
                {p.stats.map((s, j) => (
                  <div key={j}>
                    <div
                      className="num"
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: 'Inter Tight',
                        color: 'var(--teal-700)',
                        lineHeight: 1,
                        marginBottom: 4,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)', lineHeight: 1.4 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div
        style={{
          marginBottom: 14,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 8,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Команда проекта</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
            Мультидисциплинарная команда: медицина, психология, технологии
          </p>
        </div>
        <span
          className="mono"
          style={{ fontSize: 11.5, color: 'var(--ink-400)', letterSpacing: '0.06em' }}
        >
          04 / КОМАНДА
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {TEAM.map((m, i) => (
          <Card key={i} padding={20}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Avatar name={m.name} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, marginBottom: 2 }}>{m.name}</h3>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--teal-700)',
                    fontWeight: 500,
                    marginBottom: 10,
                  }}
                >
                  {m.role}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-600)',
                    lineHeight: 1.55,
                    margin: '0 0 12px',
                  }}
                >
                  {m.bio}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.tags.map((t, j) => (
                    <Badge key={j} tone="neutral" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card
        padding={28}
        style={{
          background: 'linear-gradient(135deg, #ECFBFA 0%, #FFFFFF 70%)',
          border: '1px solid var(--teal-100)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Участвовать в пилоте</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.55, margin: 0 }}>
              Мы формируем новую культуру медицинской коммуникации, начиная со студенческой скамьи.
              Присоединяйтесь к пилотному тестированию — ваша обратная связь сделает кейсы точнее.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" icon="users" disabled>
              Участвовать в пилоте
            </Button>
            <Button variant="secondary" icon="mail" onClick={handleContact}>
              Связаться
            </Button>
          </div>
        </div>
      </Card>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
