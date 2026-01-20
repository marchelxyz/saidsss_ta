import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const pool = getPool();
  const [leadCount, newLeads, articleCount, caseCount] = await Promise.all([
    pool.query("select count(*)::int as count from leads"),
    pool.query("select count(*)::int as count from leads where status = 'new'"),
    pool.query("select count(*)::int as count from articles"),
    pool.query("select count(*)::int as count from cases")
  ]);

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Дашборд</h1>
      </div>
      <div className="admin-grid">
        <div className="admin-card">
          <p className="section-subtitle">Всего лидов</p>
          <strong style={{ fontSize: 28 }}>{leadCount.rows[0]?.count ?? 0}</strong>
        </div>
        <div className="admin-card">
          <p className="section-subtitle">Новые лиды</p>
          <strong style={{ fontSize: 28 }}>{newLeads.rows[0]?.count ?? 0}</strong>
        </div>
        <div className="admin-card">
          <p className="section-subtitle">Статей</p>
          <strong style={{ fontSize: 28 }}>{articleCount.rows[0]?.count ?? 0}</strong>
        </div>
        <div className="admin-card">
          <p className="section-subtitle">Кейсов</p>
          <strong style={{ fontSize: 28 }}>{caseCount.rows[0]?.count ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}
