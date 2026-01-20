import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    active?: boolean;
  };

  const updates: string[] = [];
  const values: Array<string | boolean | null> = [];
  let idx = 1;

  if (body.name !== undefined) {
    updates.push(`name = $${idx++}`);
    values.push(body.name.trim());
  }
  if (body.role !== undefined) {
    updates.push(`role = $${idx++}`);
    values.push(body.role ?? null);
  }
  if (body.email !== undefined) {
    updates.push(`email = $${idx++}`);
    values.push(body.email ?? null);
  }
  if (body.phone !== undefined) {
    updates.push(`phone = $${idx++}`);
    values.push(body.phone ?? null);
  }
  if (body.active !== undefined) {
    updates.push(`active = $${idx++}`);
    values.push(body.active);
  }

  if (!updates.length) {
    return NextResponse.json(
      { ok: false, message: "Нет данных для обновления." },
      { status: 400 }
    );
  }

  updates.push(`updated_at = now()`);
  values.push(context.params.id);

  const pool = getPool();
  await pool.query(
    `update team_members set ${updates.join(", ")} where id = $${idx}`,
    values
  );

  await logAudit({
    action: "team_update",
    entityType: "team_member",
    entityId: context.params.id
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  await pool.query(`delete from team_members where id = $1`, [context.params.id]);
  await logAudit({
    action: "team_delete",
    entityType: "team_member",
    entityId: context.params.id
  });
  return NextResponse.json({ ok: true });
}
