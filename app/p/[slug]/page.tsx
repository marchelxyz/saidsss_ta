import { notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import SiteBlocks from "@/app/components/SiteBlocks";

export const dynamic = "force-dynamic";

type PageParams = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageParams) {
  const pool = getPool();
  const pageResult = await pool.query(
    `select title, meta_description
     from site_pages
     where slug = $1 and page_type = 'custom' and published = true
     limit 1`,
    [params.slug]
  );
  const page = pageResult.rows[0];
  if (!page) return {};
  return {
    title: page.title,
    description: page.meta_description ?? undefined
  };
}

export default async function CustomPage({ params }: PageParams) {
  const pool = getPool();
  const pageResult = await pool.query(
    `select id
     from site_pages
     where slug = $1 and page_type = 'custom' and published = true
     limit 1`,
    [params.slug]
  );
  const page = pageResult.rows[0];
  if (!page) return notFound();

  const blocksResult = await pool.query(
    `select id, block_type, content, style, sort_order
     from site_blocks where page_id = $1 order by sort_order asc`,
    [page.id]
  );

  return (
    <>
      <header className="container nav">
        <strong>TeleAgent</strong>
        <nav className="nav-links">
          <a href="/#contact">Контакты</a>
        </nav>
        <a className="btn btn-secondary" href="/#contact">
          Обсудить проект
        </a>
      </header>
      <main>
        <SiteBlocks blocks={blocksResult.rows} sourcePage={params.slug} />
      </main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <strong>TeleAgent</strong>
            <p>Трансформация бизнеса с AI под ключ.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
