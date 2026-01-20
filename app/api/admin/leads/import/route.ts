import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { parseCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { csv?: string };
  if (!body.csv) {
    return NextResponse.json(
      { ok: false, message: "Нужен CSV текст." },
      { status: 400 }
    );
  }

  const rows = parseCsv(body.csv);
  const pool = getPool();
  let inserted = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    const phone = row.phone?.trim();
    if (!name || !phone) continue;

    await pool.query(
      `insert into leads (name, phone, email, company, role, summary, message, budget, timeline, status, stage)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        name,
        phone,
        row.email ?? null,
        row.company ?? null,
        row.role ?? null,
        row.summary ?? null,
        row.message ?? null,
        row.budget ?? null,
        row.timeline ?? null,
        row.status ?? "new",
        row.stage ?? row.status ?? "new"
      ]
    );
    inserted += 1;
  }

  await logAudit({ action: "leads_import", payload: { count: inserted } });

  return NextResponse.json({ ok: true, inserted });
}
