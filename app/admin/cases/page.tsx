import Link from "next/link";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, industry, published, created_at
     from cases order by created_at desc`
  );

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Кейсы</h1>
        <Link className="btn" href="/admin/cases/new">
          Новый кейс
        </Link>
      </div>
      {result.rows.length === 0 ? (
        <div className="admin-card">Кейсов пока нет.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Slug</th>
              <th>Отрасль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.slug}</td>
                <td>{item.industry || "—"}</td>
                <td>{item.published ? "Опубликовано" : "Черновик"}</td>
                <td>
                  <Link href={`/admin/cases/${item.id}`}>Редактировать</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
