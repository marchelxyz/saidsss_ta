import { getPool } from "@/lib/db";
import PageEditor from "./PageEditor";

export const dynamic = "force-dynamic";

type PageParams = {
  params: { id: string };
};

export default async function PageEditorPage({ params }: PageParams) {
  const pool = getPool();
  const pageResult = await pool.query(
    `select id, title, slug, page_type, niche, meta_description, published
     from site_pages where id = $1`,
    [params.id]
  );
  const page = pageResult.rows[0];
  const blocksResult = await pool.query(
    `select id, block_type, content, style, sort_order
     from site_blocks where page_id = $1 order by sort_order asc`,
    [params.id]
  );

  return <PageEditor initialPage={page} initialBlocks={blocksResult.rows} />;
}
