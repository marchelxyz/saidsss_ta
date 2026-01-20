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
    `select id, name, color from lead_tags order by name`
  );

  return NextResponse.json({ ok: true, items: result.rows });
}

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    color?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Укажите тег." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const result = await pool.query(
    `insert into lead_tags (name, color)
     values ($1, $2)
     on conflict (name) do update set color = excluded.color
     returning id`,
    [name, body.color ?? null]
  );

  await logAudit({
    action: "tag_create",
    entityType: "lead_tag",
    entityId: result.rows[0]?.id,
    payload: { name }
  });

  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}
