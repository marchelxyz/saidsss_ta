import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, company_name, provider_name, source_url, country, industry, challenge, solution, result, metrics, cover_url, published
     from cases where id = $1`,
    [context.params.id]
  );

  if (!result.rows[0]) {
    return NextResponse.json({ ok: false, message: "Кейс не найден." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: result.rows[0] });
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    slug?: string;
    company_name?: string | null;
    provider_name?: string | null;
    source_url?: string | null;
    country?: string | null;
    industry?: string | null;
    challenge?: string | null;
    solution?: string | null;
    result?: string | null;
    metrics?: string | null;
    cover_url?: string | null;
    published?: boolean;
  };

  const updates: string[] = [];
  const values: Array<string | boolean | null> = [];
  let idx = 1;

  if (body.title !== undefined) {
    updates.push(`title = $${idx++}`);
    values.push(body.title.trim());
  }

  if (body.slug !== undefined) {
    const slugValue = body.slug?.trim()
      ? body.slug.trim()
      : body.title
      ? slugify(body.title)
      : undefined;
    if (slugValue) {
      updates.push(`slug = $${idx++}`);
      values.push(slugValue);
    }
  }

  const optionalFields: Array<[string, string | null | undefined]> = [
    ["company_name", body.company_name],
    ["provider_name", body.provider_name],
    ["source_url", body.source_url],
    ["country", body.country],
    ["industry", body.industry],
    ["challenge", body.challenge],
    ["solution", body.solution],
    ["result", body.result],
    ["metrics", body.metrics],
    ["cover_url", body.cover_url]
  ];

  for (const [field, value] of optionalFields) {
    if (value !== undefined) {
      updates.push(`${field} = $${idx++}`);
      values.push(value ?? null);
    }
  }

  if (body.published !== undefined) {
    updates.push(`published = $${idx++}`);
    values.push(body.published);
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
    `update cases set ${updates.join(", ")} where id = $${idx}`,
    values
  );

  await logAudit({
    action: "case_update",
    entityType: "case",
    entityId: context.params.id
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  await pool.query(`delete from cases where id = $1`, [context.params.id]);
  await logAudit({
    action: "case_delete",
    entityType: "case",
    entityId: context.params.id
  });
  return NextResponse.json({ ok: true });
}
