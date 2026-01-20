import Link from "next/link";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, published, created_at
     from articles order by created_at desc`
  );

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Статьи</h1>
        <Link className="btn" href="/admin/articles/new">
          Новая статья
        </Link>
      </div>
      {result.rows.length === 0 ? (
        <div className="admin-card">Статей пока нет.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Slug</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.slug}</td>
                <td>{item.published ? "Опубликовано" : "Черновик"}</td>
                <td>
                  <Link href={`/admin/articles/${item.id}`}>Редактировать</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
