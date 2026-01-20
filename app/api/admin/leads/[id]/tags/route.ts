import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function PUT(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: string[] };
  const tags = (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean);

  const pool = getPool();
  await pool.query(`delete from lead_tag_map where lead_id = $1`, [context.params.id]);

  for (const tagName of tags) {
    const tagResult = await pool.query(
      `insert into lead_tags (name)
       values ($1)
       on conflict (name) do update set name = excluded.name
       returning id`,
      [tagName]
    );
    const tagId = tagResult.rows[0]?.id as string | undefined;
    if (tagId) {
      await pool.query(
        `insert into lead_tag_map (lead_id, tag_id)
         values ($1, $2) on conflict do nothing`,
        [context.params.id, tagId]
      );
    }
  }

  await logAudit({
    action: "lead_tags_update",
    entityType: "lead",
    entityId: context.params.id,
    payload: { tags }
  });

  return NextResponse.json({ ok: true });
}
