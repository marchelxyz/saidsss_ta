import { getPool } from "@/lib/db";
import LeadRow from "./LeadRow";
import LeadTools from "./LeadTools";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const pool = getPool();
  const [leadResult, tagResult, taskResult, stageResult, teamResult] = await Promise.all([
    pool.query(
      `select id, name, phone, email, company, role, summary, message, status, stage, notes,
              analysis_status, analysis_summary
       from leads
       order by created_at desc
       limit 200`
    ),
    pool.query(
      `select ltm.lead_id, lt.name
       from lead_tag_map ltm
       join lead_tags lt on lt.id = ltm.tag_id`
    ),
    pool.query(
      `select id, lead_id, title, status, due_date, assignee_id
       from lead_tasks order by created_at desc`
    ),
    pool.query(`select name from lead_stages order by sort_order asc`),
    pool.query(`select id, name from team_members where active = true order by name`)
  ]);

  const tagsByLead = new Map<string, string[]>();
  for (const row of tagResult.rows as Array<{ lead_id: string; name: string }>) {
    const list = tagsByLead.get(row.lead_id) ?? [];
    list.push(row.name);
    tagsByLead.set(row.lead_id, list);
  }

  const tasksByLead = new Map<string, Array<{ id: string; title: string; status: string; due_date?: string | null; assignee_id?: string | null }>>();
  for (const row of taskResult.rows as Array<{
    id: string;
    lead_id: string;
    title: string;
    status: string;
    due_date?: Date | string | null;
    assignee_id?: string | null;
  }>) {
    const list = tasksByLead.get(row.lead_id) ?? [];
    const dueDate =
      row.due_date instanceof Date
        ? row.due_date.toISOString().slice(0, 10)
        : row.due_date ?? null;
    list.push({
      id: row.id,
      title: row.title,
      status: row.status,
      due_date: dueDate,
      assignee_id: row.assignee_id
    });
    tasksByLead.set(row.lead_id, list);
  }

  const stages = (stageResult.rows as Array<{ name: string }>).map((row) => row.name);
  const stageList = stages.length ? stages : ["new", "qualification", "proposal", "negotiation", "won", "lost"];
  const team = teamResult.rows as Array<{ id: string; name: string }>;
  const leads = leadResult.rows as Array<{
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    company?: string | null;
    role?: string | null;
    summary?: string | null;
    message?: string | null;
    status?: string | null;
    stage?: string | null;
    notes?: string | null;
    analysis_status?: string | null;
    analysis_summary?: string | null;
  }>;

  const leadsByStage = new Map<string, typeof leads>();
  for (const stage of stageList) {
    leadsByStage.set(stage, []);
  }
  for (const lead of leads) {
    const bucket = lead.stage ?? "new";
    const list = leadsByStage.get(bucket) ?? [];
    list.push(lead);
    leadsByStage.set(bucket, list);
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">CRM</h1>
        <p className="section-subtitle">Последние 200 лидов</p>
      </div>
      <LeadTools />
      {leads.length === 0 ? (
        <div className="admin-card">Лидов пока нет.</div>
      ) : (
        <div className="admin-board">
          {stageList.map((stageName) => (
            <div key={stageName} className="admin-column">
              <h3>{stageName}</h3>
              {(leadsByStage.get(stageName) ?? []).map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  tags={tagsByLead.get(lead.id) ?? []}
                  tasks={tasksByLead.get(lead.id) ?? []}
                  stages={stageList}
                  team={team}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
