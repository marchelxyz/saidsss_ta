import { notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import SiteBlocks from "@/app/components/SiteBlocks";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

type PageParams = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageParams) {
  const pool = getPool();
  const pageResult = await pool.query(
    `select title, meta_description, published, generation_status
     from site_pages
     where slug = $1 and page_type = 'industry'
     limit 1`,
    [params.slug]
  );
  const page = pageResult.rows[0];
  if (!page) return {};
  if (!page.published && page.generation_status === "pending") {
    return {
      title: `${page.title} — генерация`,
      description: "Страница генерируется. Обновите через пару минут."
    };
  }
  return {
    title: page.title,
    description: page.meta_description ?? undefined
  };
}

export default async function IndustryPage({ params }: PageParams) {
  const pool = getPool();
  const pageResult = await pool.query(
    `select id, title, published, generation_status, generation_error
     from site_pages
     where slug = $1 and page_type = 'industry'
     limit 1`,
    [params.slug]
  );
  const page = pageResult.rows[0];
  if (!page) return notFound();
  if (!page.published) {
    return renderGenerationState(page.title as string, page.generation_status, page.generation_error);
  }

  const blocksResult = await pool.query(
    `select id, block_type, content, style, sort_order
     from site_blocks where page_id = $1 order by sort_order asc`,
    [page.id]
  );
  const navItems = blocksResult.rows
    .filter((block) => block.block_type !== "hero" && block.block_type !== "contact")
    .map((block) => ({
      title:
        (block.content?.short_title as string | undefined) ||
        (block.content?.title as string | undefined) ||
        "",
      id: slugify((block.content?.title as string | undefined) ?? "")
    }))
    .filter((item) => item.title && item.id)
    .slice(0, 6);

  return (
    <>
      <header className="container nav">
        <strong>TeleAgent</strong>
        <nav className="nav-links">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.title}
            </a>
          ))}
          <a href="#contact">Контакты</a>
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

function renderGenerationState(
  title: string,
  generationStatus: string | null,
  generationError: string | null
) {
  if (generationStatus === "failed") {
    return (
      <main className="container" style={{ padding: "80px 0" }}>
        <h1>{title}</h1>
        <p>Страница не сгенерировалась. Попробуйте создать заново.</p>
        {generationError && <p>Причина: {generationError}</p>}
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "80px 0" }}>
      <h1>{title}</h1>
      <p>Страница генерируется. Обновите через минуту.</p>
    </main>
  );
}
