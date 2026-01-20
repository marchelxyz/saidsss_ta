import { getPool } from "./db";

export async function logAudit(params: {
  actor?: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  const pool = getPool();
  await pool.query(
    `insert into audit_logs (actor, action, entity_type, entity_id, payload)
     values ($1, $2, $3, $4, $5)`,
    [
      params.actor ?? null,
      params.action,
      params.entityType ?? null,
      params.entityId ?? null,
      params.payload ?? null
    ]
  );
}
