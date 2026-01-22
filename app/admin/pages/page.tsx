import { getPool } from "@/lib/db";
import PageManager from "./PageManager";

export const dynamic = "force-dynamic";

export default async function AdminPages() {
  const pool = getPool();
  const pagesResult = await pool.query(
    `select p.id,
            p.title,
            p.slug,
            p.page_type,
            p.niche,
            p.meta_description,
            p.published,
            count(l.id)::int as leads_count
     from site_pages p
     left join leads l on l.source_page = p.slug
     group by p.id
     order by p.created_at desc`
  );

  return <PageManager initialPages={pagesResult.rows} />;
}
