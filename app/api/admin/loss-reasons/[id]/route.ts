import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    sort_order?: number;
  };
  const updates: string[] = [];
  const values: Array<string | number> = [];
  let idx = 1;

  if (body.name !== undefined) {
    updates.push(`name = $${idx++}`);
    values.push(body.name.trim());
  }
  if (body.sort_order !== undefined) {
    updates.push(`sort_order = $${idx++}`);
    values.push(body.sort_order);
  }

  if (!updates.length) {
    return NextResponse.json({ ok: false, message: "Нет данных" }, { status: 400 });
  }

  values.push(context.params.id);
  const pool = getPool();
  await pool.query(
    `update lead_loss_reasons set ${updates.join(", ")} where id = $${idx}`,
    values
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const pool = getPool();
  await pool.query(`delete from lead_loss_reasons where id = $1`, [context.params.id]);
  return NextResponse.json({ ok: true });
}
