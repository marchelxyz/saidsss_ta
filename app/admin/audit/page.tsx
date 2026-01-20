import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const pool = getPool();
  const result = await pool.query(
    `select actor, action, entity_type, entity_id, created_at
     from audit_logs order by created_at desc limit 200`
  );

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">История действий</h1>
        <p className="section-subtitle">Последние 200 событий</p>
      </div>
      {result.rows.length === 0 ? (
        <div className="admin-card">История пока пустая.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Действие</th>
              <th>Сущность</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((item) => (
              <tr key={`${item.action}-${item.created_at}`}> 
                <td>{new Date(item.created_at).toLocaleString("ru-RU")}</td>
                <td>{item.action}</td>
                <td>{item.entity_type ?? "—"}</td>
                <td>{item.entity_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
