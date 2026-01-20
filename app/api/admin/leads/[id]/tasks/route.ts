import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    due_date?: string;
    assignee_id?: string;
  };

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, message: "Укажите задачу." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const result = await pool.query(
    `insert into lead_tasks (lead_id, title, due_date, assignee_id)
     values ($1, $2, $3, $4)
     returning id`,
    [context.params.id, title, body.due_date ?? null, body.assignee_id ?? null]
  );

  await logAudit({
    action: "lead_task_create",
    entityType: "lead",
    entityId: context.params.id,
    payload: { title }
  });

  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    task_id?: string;
    status?: string;
  };

  if (!body.task_id || !body.status) {
    return NextResponse.json(
      { ok: false, message: "Недостаточно данных." },
      { status: 400 }
    );
  }

  const pool = getPool();
  await pool.query(
    `update lead_tasks set status = $1, updated_at = now() where id = $2`,
    [body.status, body.task_id]
  );

  await logAudit({
    action: "lead_task_update",
    entityType: "lead",
    entityId: context.params.id,
    payload: { task_id: body.task_id, status: body.status }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { task_id?: string };
  if (!body.task_id) {
    return NextResponse.json(
      { ok: false, message: "Укажите задачу." },
      { status: 400 }
    );
  }

  const pool = getPool();
  await pool.query(`delete from lead_tasks where id = $1`, [body.task_id]);

  await logAudit({
    action: "lead_task_delete",
    entityType: "lead",
    entityId: context.params.id,
    payload: { task_id: body.task_id }
  });

  return NextResponse.json({ ok: true });
}
