import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select id, actor, action, entity_type, entity_id, created_at
     from audit_logs order by created_at desc limit 200`
  );

  return NextResponse.json({ ok: true, items: result.rows });
}
