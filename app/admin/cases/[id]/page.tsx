import CaseForm from "../CaseForm";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CaseEditPage({ params }: { params: { id: string } }) {
  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, company_name, provider_name, source_url, country, industry, challenge, solution, result, metrics, cover_url, published
     from cases where id = $1`,
    [params.id]
  );

  const item = result.rows[0];

  if (!item) {
    return <div className="admin-card">Кейс не найден.</div>;
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Редактирование кейса</h1>
      </div>
      <CaseForm initial={item} />
    </div>
  );
}
