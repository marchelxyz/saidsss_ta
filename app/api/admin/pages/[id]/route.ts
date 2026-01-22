import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { logAudit } from "@/lib/audit";

type PageUpdatePayload = {
  title?: string;
  slug?: string;
  pageType?: string;
  niche?: string;
  metaDescription?: string;
  published?: boolean;
  blocks?: Array<{
    block_type: string;
    content: Record<string, unknown>;
    style?: Record<string, unknown>;
    sort_order?: number;
  }>;
};

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const pool = getPool();
  const pageResult = await pool.query(
    `select id, title, slug, page_type, niche, meta_description, published
     from site_pages where id = $1`,
    [id]
  );

  if (!pageResult.rows[0]) {
    return NextResponse.json({ ok: false, message: "Страница не найдена." }, { status: 404 });
  }

  const blocksResult = await pool.query(
    `select id, block_type, content, style, sort_order
     from site_blocks where page_id = $1 order by sort_order asc`,
    [id]
  );

  return NextResponse.json({
    ok: true,
    page: pageResult.rows[0],
    blocks: blocksResult.rows
  });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  let body: PageUpdatePayload | null = null;
  try {
    body = (await request.json()) as PageUpdatePayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Неверный формат." }, { status: 400 });
  }

  const pool = getPool();
  await pool.query("begin");
  try {
    await pool.query(
      `update site_pages
       set title = $2,
           slug = $3,
           page_type = $4,
           niche = $5,
           meta_description = $6,
           published = $7,
           updated_at = now()
       where id = $1`,
      [
        id,
        body?.title ?? "",
        body?.slug ?? "",
        body?.pageType ?? "custom",
        body?.niche ?? null,
        body?.metaDescription ?? null,
        body?.published ?? true
      ]
    );

    if (body?.blocks) {
      await pool.query(`delete from site_blocks where page_id = $1`, [id]);

      if (body.blocks.length > 0) {
        const insertValues = body.blocks
          .map(
            (_block, index) =>
              `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
          )
          .join(", ");
        const params: Array<unknown> = [id];
        body.blocks.forEach((block, index) => {
          params.push(
            block.block_type,
            block.content ?? {},
            block.style ?? {},
            block.sort_order ?? index
          );
        });
        await pool.query(
          `insert into site_blocks (page_id, block_type, content, style, sort_order)
           values ${insertValues}`,
          params
        );
      }
    }

    await logAudit({
      action: "page_update",
      entityType: "site_page",
      entityId: id
    });

    await pool.query("commit");
    return NextResponse.json({ ok: true });
  } catch {
    await pool.query("rollback");
    return NextResponse.json(
      { ok: false, message: "Не удалось сохранить страницу." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const pool = getPool();
  await pool.query(`delete from site_pages where id = $1`, [id]);
  await logAudit({ action: "page_delete", entityType: "site_page", entityId: id });
  return NextResponse.json({ ok: true });
}
