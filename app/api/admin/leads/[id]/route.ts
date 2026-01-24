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
    is_lost?: boolean;
    loss_reason_id?: string | null;
  };

  const status = body.status?.trim();
  const stage = body.stage?.trim();
  const notes = body.notes?.trim();
  const isLost = body.is_lost;
  const lossReasonId = body.loss_reason_id ?? null;

  if (!status && !stage && notes === undefined && isLost === undefined && body.loss_reason_id === undefined) {
    return NextResponse.json(
      { ok: false, message: "Нет данных для обновления." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const updates: string[] = [];
  const values: Array<string | boolean | null> = [];
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

  if (isLost !== undefined) {
    updates.push(`is_lost = $${idx++}`);
    values.push(isLost);
  }

  if (body.loss_reason_id !== undefined) {
    updates.push(`loss_reason_id = $${idx++}`);
    values.push(lossReasonId);
  }

  values.push(context.params.id);

  await pool.query(`update leads set ${updates.join(", ")} where id = $${idx}`, values);

  await logAudit({
    action: "lead_update",
    entityType: "lead",
    entityId: context.params.id,
    payload: { status, stage, notes, isLost, lossReasonId }
  });

  return NextResponse.json({ ok: true });
}
