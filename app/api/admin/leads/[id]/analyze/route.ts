import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { analyzeLead } from "@/lib/ai";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const leadResult = await pool.query(
    `select name, company, role, summary, message, budget, timeline
     from leads where id = $1`,
    [context.params.id]
  );

  const lead = leadResult.rows[0] as
    | {
        name: string;
        company?: string;
        role?: string;
        summary?: string;
        message?: string;
        budget?: string;
        timeline?: string;
      }
    | undefined;

  if (!lead) {
    return NextResponse.json({ ok: false, message: "Лид не найден." }, { status: 404 });
  }

  await pool.query(`update leads set analysis_status = 'running' where id = $1`, [
    context.params.id
  ]);

  try {
    const analysis = await analyzeLead(lead);
    await pool.query(
      `update leads
       set analysis_status = 'done',
           analysis_summary = $2,
           analysis_json = $3,
           analyzed_at = now()
       where id = $1`,
      [context.params.id, analysis.summary, analysis]
    );

    await logAudit({
      action: "lead_ai_analyze",
      entityType: "lead",
      entityId: context.params.id,
      payload: { summary: analysis.summary }
    });

    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    await pool.query(`update leads set analysis_status = 'failed' where id = $1`, [
      context.params.id
    ]);

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "AI ошибка" },
      { status: 500 }
    );
  }
}
