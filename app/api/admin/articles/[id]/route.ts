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
    `select id, title, slug, excerpt, content, cover_url, published
     from articles where id = $1`,
    [context.params.id]
  );

  if (!result.rows[0]) {
    return NextResponse.json({ ok: false, message: "Статья не найдена." }, { status: 404 });
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
    excerpt?: string | null;
    content?: string | null;
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

  if (body.excerpt !== undefined) {
    updates.push(`excerpt = $${idx++}`);
    values.push(body.excerpt ?? null);
  }

  if (body.content !== undefined) {
    updates.push(`content = $${idx++}`);
    values.push(body.content ?? null);
  }

  if (body.cover_url !== undefined) {
    updates.push(`cover_url = $${idx++}`);
    values.push(body.cover_url ?? null);
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
    `update articles set ${updates.join(", ")} where id = $${idx}`,
    values
  );

  await logAudit({
    action: "article_update",
    entityType: "article",
    entityId: context.params.id
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  await pool.query(`delete from articles where id = $1`, [context.params.id]);
  await logAudit({
    action: "article_delete",
    entityType: "article",
    entityId: context.params.id
  });
  return NextResponse.json({ ok: true });
}
