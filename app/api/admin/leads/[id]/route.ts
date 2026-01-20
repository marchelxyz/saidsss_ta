import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    stage?: string;
    notes?: string;
  };

  const status = body.status?.trim();
  const stage = body.stage?.trim();
  const notes = body.notes?.trim();

  if (!status && !stage && notes === undefined) {
    return NextResponse.json(
      { ok: false, message: "Нет данных для обновления." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const updates: string[] = [];
  const values: Array<string | null> = [];
  let idx = 1;

  if (status) {
    updates.push(`status = $${idx++}`);
    values.push(status);
  }

  if (stage) {
    updates.push(`stage = $${idx++}`);
    values.push(stage);
  }

  if (notes !== undefined) {
    updates.push(`notes = $${idx++}`);
    values.push(notes === "" ? null : notes);
  }

  values.push(context.params.id);

  await pool.query(`update leads set ${updates.join(", ")} where id = $${idx}`, values);

  await logAudit({
    action: "lead_update",
    entityType: "lead",
    entityId: context.params.id,
    payload: { status, stage, notes }
  });

  return NextResponse.json({ ok: true });
}
