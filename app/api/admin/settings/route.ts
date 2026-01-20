import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select telegram, email, phone, address
     from site_settings where id = 1`
  );

  return NextResponse.json({ ok: true, settings: result.rows[0] ?? {} });
}

export async function PUT(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    telegram?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const pool = getPool();
  await pool.query(
    `update site_settings
     set telegram = $1,
         email = $2,
         phone = $3,
         address = $4,
         updated_at = now()
     where id = 1`,
    [
      body.telegram?.trim() ?? null,
      body.email?.trim() ?? null,
      body.phone?.trim() ?? null,
      body.address?.trim() ?? null
    ]
  );

  return NextResponse.json({ ok: true });
}
