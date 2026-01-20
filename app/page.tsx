import LeadForm from "./components/LeadForm";

const focusAreas = [
  {
    title: "Продажи",
    text: "Автоворонки, анализ лидов, ассистенты менеджеров, контроль качества звонков."
  },
  {
    title: "Маркетинг",
    text: "AI-креативы, прогноз спроса, персонализация, умные сегменты аудитории."
  },
  {
    title: "Операционные процессы",
    text: "Сокращение ручных задач, интеграции CRM/ERP, автоматизация отчетности."
  },
  {
    title: "HR и обучение",
    text: "Онбординг, корпоративные базы знаний, оценка персонала и навыков."
  }
];

const steps = [
  {
    title: "Аудит отделов и целей",
    text: "Погружаемся в бизнес, выявляем узкие места, считаем потери и потенциал AI." 
  },
  {
    title: "Карта AI-внедрений",
    text: "Определяем процессы для замены/усиления ИИ, оцениваем ROI и риски."
  },
  {
    title: "Внедрение под ключ",
    text: "Запускаем автоматизации, подключаем модели и интеграции, тестируем гипотезы."
  },
  {
    title: "Обучение команды",
    text: "Обучаем сотрудников работать с AI-инструментами и закрепляем новую модель."
  }
];

const results = [
  {
    title: "-25% расходов",
    text: "Снижаем затраты на рутинные операции за счет автоматизаций."
  },
  {
    title: "+40% скорости",
    text: "Ускоряем обработку заявок, аналитики и внутреннего сервиса."
  },
  {
    title: "Рост LTV",
    text: "Поднимаем удержание через персонализацию и предиктивные сценарии."
  }
];

const faqs = [
  {
    q: "Сколько длится аудит?",
    a: "В среднем 1–2 недели. Для сложных структур — до 4 недель."
  },
  {
    q: "Насколько безопасны данные?",
    a: "Используем корпоративные контуры, шифрование и разграничение доступов."
  },
  {
    q: "Можно ли начать с одного отдела?",
    a: "Да, делаем пилот, считаем эффект и масштабируем на другие отделы."
  }
];

export default function Home() {
  return (
    <>
      <header className="container nav">
        <strong>TeleAgent</strong>
        <nav className="nav-links">
          <a href="#benefits">Преимущества</a>
          <a href="#process">Процесс</a>
          <a href="#cases">Результаты</a>
          <a href="#contact">Контакты</a>
        </nav>
        <a className="btn btn-secondary" href="#contact">
          Обсудить проект
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="hero-badges">
                <span className="badge">Аудит процессов</span>
                <span className="badge">AI-автоматизация</span>
                <span className="badge">Обучение команд</span>
              </div>
              <h1>TeleAgent — трансформация бизнеса с AI под ключ</h1>
              <p>
                Я захожу в организацию, провожу аудит всех отделов и показываю, где
                людей может заменить или усилить ИИ. Формируем карту внедрений,
                запускаем автоматизации и обучаем команду.
              </p>
              <div className="button-row">
                <a className="btn" href="#contact">
                  Получить аудит
                </a>
                <a className="btn btn-secondary" href="#cases">
                  Посмотреть результаты
                </a>
              </div>
              <div className="stats">
                <div className="stat">
                  <strong>12+ недель</strong>
                  от аудита до масштабирования
                </div>
                <div className="stat">
                  <strong>5 отделов</strong>
                  в среднем покрываем AI
                </div>
                <div className="stat">
                  <strong>ROI 3-6x</strong>
                  типичный эффект проектов
                </div>
              </div>
            </div>
            <div className="card">
              <p className="pill">Что вы получите</p>
              <h3>AI-дорожную карту под ваш бизнес</h3>
              <p>
                Четкий список процессов, где AI дает быстрый эффект, прогноз экономии
                и план внедрения на 90 дней.
              </p>
              <div className="grid" style={{ marginTop: 20 }}>
                <div className="card">
                  <strong>Аудит</strong>
                  <p>Интервью, сбор метрик, диагностика узких мест.</p>
                </div>
                <div className="card">
                  <strong>Внедрение</strong>
                  <p>Интеграции, автоматизации, управление изменениями.</p>
                </div>
                <div className="card">
                  <strong>Обучение</strong>
                  <p>Работа с командами, регламенты и best practices.</p>
                </div>
                <div className="card">
                  <strong>Контроль</strong>
                  <p>Метрики эффективности и сопровождение.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="benefits">
          <div className="container">
            <h2 className="section-title">Где мы усиливаем бизнес</h2>
            <p className="section-subtitle">
              TeleAgent помогает бизнесу быстро внедрять AI, не перегружая команды и
              сохраняя управляемость.
            </p>
            <div className="grid">
              {focusAreas.map((item) => (
                <div className="card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="process">
          <div className="container">
            <h2 className="section-title">Как выглядит процесс</h2>
            <p className="section-subtitle">
              Делаем AI-внедрение управляемым и измеримым на каждом этапе.
            </p>
            <div className="steps">
              {steps.map((step, index) => (
                <div className="step" key={step.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="cases">
          <div className="container">
            <h2 className="section-title">Результаты и эффекты</h2>
            <p className="section-subtitle">
              Фокусируемся на бизнес-метриках: скорость процессов, экономия и рост
              выручки.
            </p>
            <div className="grid">
              {results.map((result) => (
                <div className="card" key={result.title}>
                  <h3>{result.title}</h3>
                  <p>{result.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="container">
            <h2 className="section-title">FAQ</h2>
            <div className="faq">
              {faqs.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="container">
            <h2 className="section-title">Обсудим ваш проект</h2>
            <p className="section-subtitle">
              Оставьте контакты — вернемся с рекомендациями и оценкой проекта.
            </p>
            <div className="grid">
              <div className="card">
                <h3>Заполните форму</h3>
                <p>Свяжемся в течение 24 часов и подготовим план аудита.</p>
                <LeadForm />
              </div>
              <div className="card">
                <h3>Контакты</h3>
                <p>Telegram: @teleagent_ai</p>
                <p>Email: hello@teleagent.ai</p>
                <p>Телефон: +7 (999) 0
