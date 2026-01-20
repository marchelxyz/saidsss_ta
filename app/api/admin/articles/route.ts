import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { slugify } from "@/lib/slug";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, excerpt, published, created_at, updated_at
     from articles order by created_at desc`
  );

  return NextResponse.json({ ok: true, items: result.rows });
}

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    cover_url?: string;
    published?: boolean;
  };

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, message: "Укажите заголовок." },
      { status: 400 }
    );
  }

  const slug = body.slug?.trim() || slugify(title);

  const pool = getPool();
  const result = await pool.query(
    `insert into articles (title, slug, excerpt, content, cover_url, published)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      title,
      slug,
      body.excerpt ?? null,
      body.content ?? null,
      body.cover_url ?? null,
      body.published ?? false
    ]
  );

  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}
