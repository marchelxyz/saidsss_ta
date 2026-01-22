import { getPool } from "@/lib/db";
import { getDefaultHomeBlocks } from "@/lib/homeBlocks";
import VisualBuilder from "./visual-builder";

export const dynamic = "force-dynamic";

type PageParams = {
  params: { id: string };
};

export default async function VisualBuilderPage({ params }: PageParams) {
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

  let blocks = blocksResult.rows;

  if (page?.slug === "home" && blocks.length === 0) {
    const defaultBlocks = getDefaultHomeBlocks();
    if (defaultBlocks.length > 0) {
      const insertValues = defaultBlocks
        .map(
          (_block, index) =>
            `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
        )
        .join(", ");
      const paramsList: Array<unknown> = [page.id];
      defaultBlocks.forEach((block, index) => {
        paramsList.push(block.block_type, block.content, block.style ?? {}, index);
      });
      await pool.query(
        `insert into site_blocks (page_id, block_type, content, style, sort_order)
         values ${insertValues}`,
        paramsList
      );
      const refreshed = await pool.query(
        `select id, block_type, content, style, sort_order
         from site_blocks where page_id = $1 order by sort_order asc`,
        [page.id]
      );
      blocks = refreshed.rows;
    }
  }

  return <VisualBuilder initialPage={page} initialBlocks={blocks} />;
}
