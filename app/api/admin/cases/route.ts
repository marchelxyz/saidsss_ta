import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select id, title, slug, company_name, provider_name, source_url, country, industry, published, created_at, updated_at
     from cases order by created_at desc`
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
    company_name?: string;
    provider_name?: string;
    source_url?: string;
    country?: string;
    industry?: string;
    challenge?: string;
    solution?: string;
    result?: string;
    metrics?: string;
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
    `insert into cases (title, slug, company_name, provider_name, source_url, country, industry, challenge, solution, result, metrics, cover_url, published)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     returning id`,
    [
      title,
      slug,
      body.company_name ?? null,
      body.provider_name ?? null,
      body.source_url ?? null,
      body.country ?? null,
      body.industry ?? null,
      body.challenge ?? null,
      body.solution ?? null,
      body.result ?? null,
      body.metrics ?? null,
      body.cover_url ?? null,
      body.published ?? false
    ]
  );

  await logAudit({
    action: "case_create",
    entityType: "case",
    entityId: result.rows[0]?.id,
    payload: { title }
  });

  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}
