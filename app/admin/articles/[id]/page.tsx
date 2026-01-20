import ArticleForm from "../ArticleForm";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ArticleEditPage({ params }: { params: { id: string } }) {
  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, excerpt, content, cover_url, published
     from articles where id = $1`,
    [params.id]
  );

  const article = result.rows[0];

  if (!article) {
    return <div className="admin-card">Статья не найдена.</div>;
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Редактирование статьи</h1>
      </div>
      <ArticleForm initial={article} />
    </div>
  );
}
