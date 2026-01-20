import { getPool } from "@/lib/db";
import LeadRow from "./LeadRow";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const pool = getPool();
  const result = await pool.query(
    `select id, name, phone, email, company, role, summary, message, status, notes,
            analysis_status, analysis_summary
     from leads
     order by created_at desc
     limit 200`
  );

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">CRM</h1>
        <p className="section-subtitle">Последние 200 лидов</p>
      </div>
      {result.rows.length === 0 ? (
        <div className="admin-card">Лидов пока нет.</div>
      ) : (
        result.rows.map((lead) => <LeadRow key={lead.id} lead={lead} />)
      )}
    </div>
  );
}
