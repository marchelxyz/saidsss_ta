import { getPool } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

type CaseRow = {
  id: string;
  title: string;
  slug: string;
  company_name?: string | null;
  provider_name?: string | null;
  source_url?: string | null;
  country?: string | null;
  industry?: string | null;
  challenge?: string | null;
  solution?: string | null;
  result?: string | null;
  metrics?: string | null;
  cover_url?: string | null;
};

type CaseImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

export default async function CasePage({ params }: { params: { slug: string } }) {
  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, company_name, provider_name, source_url, country, industry,
            challenge, solution, result, metrics, cover_url
     from cases where slug = $1 and published = true`,
    [params.slug]
  );

  const item = result.rows[0] as CaseRow | undefined;

  if (!item) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <h1 className="section-title">Кейс не найден</h1>
            <Link className="btn btn-secondary" href="/">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const imagesResult = await pool.query(
    `select id, image_url, sort_order
     from case_images
     where case_id = $1
     order by sort_order asc, created_at asc`,
    [item.id]
  );
  const images = imagesResult.rows as CaseImage[];

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 960 }}>
        <div className="card">
          <Link className="pill" href="/">
            Назад
          </Link>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            {item.title}
          </h1>
          <div className="section-subtitle" style={{ marginBottom: 12 }}>
            {item.company_name && <span>{item.company_name}</span>}
            {item.provider_name && <span> · Партнер: {item.provider_name}</span>}
            {item.country && <span> · {item.country}</span>}
            {item.industry && <span> · {item.industry}</span>}
            {item.source_url && (
              <>
                {" "}
                ·{" "}
                <a href={item.source_url} target="_blank" rel="noreferrer">
                  Источник
                </a>
              </>
            )}
          </div>
          {item.cover_url && (
            <img
              src={item.cover_url}
              alt={item.title}
              style={{ borderRadius: 16, margin: "16px 0" }}
            />
          )}
          {renderCaseSection("Задача", item.challenge)}
          {renderCaseSection("Решение", item.solution)}
          {renderCaseSection("Результат", item.result)}
          {renderCaseSection("Метрики", item.metrics)}
          {images.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Фото</h3>
              <div className="grid">
                {images.map((image) => (
                  <div className="card" key={image.id}>
                    <img
                      src={image.image_url}
                      alt="Фото кейса"
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render a case section when content is available.
 */
function renderCaseSection(title: string, value?: string | null) {
  if (!value) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
