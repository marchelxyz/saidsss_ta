import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const pool = getPool();
  const result = await pool.query(
    `select id, name, sort_order from lead_stages order by sort_order asc`
  );
  return NextResponse.json({ ok: true, items: result.rows });
}

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ ok: false, message: "Укажите стадию." }, { status: 400 });
  }
  const pool = getPool();
  const result = await pool.query(
    `insert into lead_stages (name, sort_order)
     values ($1, (select coalesce(max(sort_order), 0) + 1 from lead_stages))
     returning id`,
    [name]
  );
  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}
