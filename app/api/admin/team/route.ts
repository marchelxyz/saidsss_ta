import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select id, name, role, email, phone, active
     from team_members order by created_at desc`
  );

  return NextResponse.json({ ok: true, items: result.rows });
}

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    active?: boolean;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Укажите имя." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const result = await pool.query(
    `insert into team_members (name, role, email, phone, active)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [name, body.role ?? null, body.email ?? null, body.phone ?? null, body.active ?? true]
  );

  await logAudit({
    action: "team_create",
    entityType: "team_member",
    entityId: result.rows[0]?.id,
    payload: { name }
  });

  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}
