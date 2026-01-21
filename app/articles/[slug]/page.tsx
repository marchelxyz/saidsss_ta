import { getPool } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const pool = getPool();
  const result = await pool.query(
    `select title, excerpt, content, cover_url, created_at
     from articles where slug = $1 and published = true`,
    [params.slug]
  );

  const article = result.rows[0] as
    | {
        title: string;
        excerpt?: string | null;
        content?: string | null;
        cover_url?: string | null;
        created_at?: string | Date | null;
      }
    | undefined;

  if (!article) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <h1 className="section-title">Статья не найдена</h1>
            <Link className="btn btn-secondary" href="/">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="card">
          <Link className="pill" href="/">
            Назад
          </Link>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            {article.title}
          </h1>
          {article.excerpt && <p className="section-subtitle">{article.excerpt}</p>}
          {article.cover_url && (
            <img
              src={article.cover_url}
              alt={article.title}
              style={{ borderRadius: 16, margin: "20px 0" }}
            />
          )}
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: article.content ?? "" }}
          />
        </div>
      </div>
    </div>
  );
}
