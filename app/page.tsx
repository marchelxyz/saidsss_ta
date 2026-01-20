import LeadForm from "./components/LeadForm";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  const pool = getPool();
  const [articlesResult, casesResult, settingsResult] = await Promise.all([
    pool.query(
      `select id, title, excerpt, cover_url
       from articles where published = true
       order by created_at desc`
    ),
    pool.query(
      `select id, title, industry, result, metrics
       from cases where published = true
       order by created_at desc`
    ),
    pool.query(`select telegram, email, phone, address from site_settings where id = 1`)
  ]);

  const articles = articlesResult.rows as Array<{
    id: string;
    title: string;
    excerpt?: string | null;
    cover_url?: string | null;
  }>;

  const cases = casesResult.rows as Array<{
    id: string;
    title: string;
    industry?: string | null;
    result?: string | null;
    metrics?: string | null;
  }>;

  const settings = (settingsResult.rows[0] ?? {}) as {
    telegram?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };

  const contacts = {
    telegram: settings.telegram ?? "@teleagent_ai",
    email: settings.email ?? "hello@teleagent.ai",
    phone: settings.phone ?? "+7 (999) 000-00-00",
    address: settings.address ?? "Удаленно по РФ и СНГ"
  };
  return (
    <>
      <header className="container nav">
        <strong>TeleAgent</strong>
        <nav className="nav-links">
          <a href="#benefits">Преимущества</a>
          <a href="#process">Процесс</a>
          <a href="#results">Результаты</a>
          <a href="#cases">Кейсы</a>
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
                <a className="btn btn-secondary" href="#results">
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

        <section className="section" id="results">
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

        {cases.length > 0 && (
          <section className="section" id="cases">
            <div className="container">
              <h2 className="section-title">Кейсы</h2>
              <p className="section-subtitle">
                Реальные примеры внедрения AI и автоматизаций для бизнеса.
              </p>
              <div className="grid">
                {cases.map((item) => (
                  <div className="card" key={item.id}>
                    <h3>{item.title}</h3>
                    {item.industry && <p>Отрасль: {item.industry}</p>}
                    {item.result && <p>Результат: {item.result}</p>}
                    {item.metrics && <p>Метрики: {item.metrics}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section className="section" id="articles">
            <div className="container">
              <h2 className="section-title">Статьи</h2>
              <p className="section-subtitle">
                Практика, разборы кейсов и подходы к AI-трансформации бизнеса.
              </p>
              <div className="grid">
                {articles.map((article) => (
                  <div className="card" key={article.id}>
                    <h3>{article.title}</h3>
                    <p>{article.excerpt ?? "Описание появится после редактирования."}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
                <p>Telegram: {contacts.telegram}</p>
                <p>Email: {contacts.email}</p>
                <p>Телефон: {contacts.phone}</p>
                <div style={{ marginTop: 20 }}>
                  <p className="pill">География: {contacts.address}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <strong>TeleAgent</strong>
            <p>Трансформация бизнеса с AI под ключ.</p>
          </div>
          <div>
            <strong>Услуги</strong>
            <p>Аудит процессов</p>
            <p>AI-автоматизации</p>
            <p>Обучение команд</p>
          </div>
          <div>
            <strong>Контакты</strong>
            <p>Telegram: {contacts.telegram}</p>
            <p>Email: {contacts.email}</p>
            <p>Телефон: {contacts.phone}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
