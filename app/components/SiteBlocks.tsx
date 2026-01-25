import LeadForm from "./LeadForm";
import { slugify } from "@/lib/slug";

type SiteBlock = {
  id?: string;
  block_type: string;
  content: Record<string, any>;
  style?: Record<string, any>;
};

type SiteBlocksProps = {
  blocks: SiteBlock[];
  sourcePage?: string;
  articles?: ArticleSummary[];
  cases?: CaseSummary[];
  contacts?: {
    telegram?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  policyUrl?: string | null;
  social?: {
    vk_url?: string | null;
    telegram_url?: string | null;
    youtube_url?: string | null;
    instagram_url?: string | null;
  };
};

type SocialLink = {
  label: string;
  href: string;
};

type ArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_url?: string | null;
};

type CaseSummary = {
  id: string;
  title: string;
  slug: string;
  industry?: string | null;
  result?: string | null;
  metrics?: string | null;
};

export default function SiteBlocks({
  blocks,
  sourcePage,
  articles,
  cases,
  contacts,
  policyUrl,
  social
}: SiteBlocksProps) {
  const getSectionId = (title?: string, fallback?: string) => {
    const base = title?.toString().trim() || fallback || "";
    return base ? slugify(base) : undefined;
  };
  const socialLinks = buildSocialLinks(social);

  return (
    <>
      {blocks.map((block, index) => {
        const radius = block.style?.radius ? `${block.style.radius}px` : undefined;
        const cardStyle = radius ? { borderRadius: radius } : undefined;

        if (block.block_type === "hero") {
          return (
            <section className="hero builder-hero" key={`hero-${index}`}>
              <div className="container hero-grid">
                <div>
                  <h1>{block.content.title}</h1>
                  <p>{block.content.subtitle}</p>
                  {block.content.button_text && (
                    <div className="button-row">
                      <a className="btn" href={block.content.button_link ?? "#contact"}>
                        {block.content.button_text}
                      </a>
                    </div>
                  )}
                </div>
                <div className="card" style={cardStyle}>
                  <strong>TeleAgent</strong>
                  <p>Сделай шаг в будущее вместе с TeleAgent.</p>
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "text") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`text-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                {renderRichText(block.content.text)}
              </div>
            </section>
          );
        }

        if (block.block_type === "faq") {
          const items = (block.content.items ?? []) as Array<{
            question?: string;
            answer?: string;
          }>;
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`faq-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="faq">
                  {items.map((item, itemIndex) => (
                    <details key={`faq-${itemIndex}`}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "list") {
          const items = (block.content.items ?? []) as string[];
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`list-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="grid">
                  {items.map((item, itemIndex) => (
                    <div className="card" style={cardStyle} key={`item-${itemIndex}`}>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "pain_cards") {
          const items = (block.content.items ?? []) as Array<{
            title?: string;
            description?: string;
            loss_amount?: string;
          }>;
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`pain-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="grid">
                  {items.map((item, itemIndex) => (
                    <div className="card" style={cardStyle} key={`pain-${itemIndex}`}>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      {item.loss_amount && <p className="loss">{item.loss_amount}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "process_map") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const steps = (block.content.steps ?? []) as Array<{
            title?: string;
            subtitle?: string;
            items?: string[];
          }>;
          const result = (block.content.result ?? null) as
            | { title?: string; subtitle?: string }
            | null;
          return (
            <section className="section process-map" key={`process-map-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="process-map-track">
                  {steps.map((step, stepIndex) => (
                    <div className="process-step" key={`process-step-${stepIndex}`}>
                      <div className="process-node">
                        <span className="process-index">{stepIndex + 1}</span>
                        <h3>{step.title}</h3>
                        <p>{step.subtitle}</p>
                      </div>
                      {(step.items ?? []).length > 0 && (
                        <div className="process-substeps">
                          {(step.items ?? []).map((item, itemIndex) => (
                            <div className="process-substep" key={`process-sub-${itemIndex}`}>
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {result && (
                  <div className="process-result">
                    <h3>{result.title}</h3>
                    <p>{result.subtitle}</p>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (block.block_type === "process_compare") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const oldWay = (block.content.old_way ?? []) as string[];
          const newWay = (block.content.new_way_ai ?? []) as string[];
          return (
            <section className="section" key={`process-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                {block.content.subtitle && (
                  <p className="section-subtitle">{block.content.subtitle}</p>
                )}
                <div className="compare-grid">
                  <div className="card">
                    <strong>Как сейчас</strong>
                    <ul>
                      {oldWay.map((step, stepIndex) => (
                        <li key={`old-${stepIndex}`}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="card highlight">
                    <strong>С TeleAgent</strong>
                    <ul>
                      {newWay.map((step, stepIndex) => (
                        <li key={`new-${stepIndex}`}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "roi") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const details = block.content.details as
            | Array<{ title?: string; description?: string }>
            | undefined;
          const hasDetails = Array.isArray(details) && details.length > 0;
          return (
            <section className="section" key={`roi-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="stats-grid">
                  {hasDetails ? (
                    details.map((item, itemIndex) => (
                      <div className="stat-card" key={`roi-${itemIndex}`}>
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="stat-card">
                        <strong>{block.content.hours_saved_per_month}</strong>
                        <span>часов в месяц</span>
                      </div>
                      <div className="stat-card">
                        <strong>{block.content.savings_percentage}%</strong>
                        <span>снижение затрат</span>
                      </div>
                      <div className="stat-card">
                        <strong>{block.content.revenue_uplift_percentage}%</strong>
                        <span>рост выручки</span>
                      </div>
                      <div className="stat-card">
                        <strong>{block.content.roi_percentage}%</strong>
                        <span>ROI</span>
                      </div>
                      <div className="stat-card">
                        <strong>{block.content.payback_period_months} мес</strong>
                        <span>окупаемость</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "badges") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const items = (block.content.items ?? []) as string[];
          return (
            <section className="section" key={`badges-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="badge-grid">
                  {items.map((item, itemIndex) => (
                    <span className="badge" key={`badge-${itemIndex}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "comparison_table") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const rows = (block.content.rows ?? []) as Array<{
            feature?: string;
            human?: string;
            ai?: string;
          }>;
          return (
            <section className="section" key={`compare-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="comparison-table">
                  <div className="comparison-row header">
                    <div>Показатель</div>
                    <div>Человек</div>
                    <div className="highlight">AI</div>
                  </div>
                  {rows.map((row, rowIndex) => (
                    <div className="comparison-row" key={`row-${rowIndex}`}>
                      <div>{row.feature}</div>
                      <div>{row.human}</div>
                      <div className="highlight">{row.ai}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "case_study") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const bullets = (block.content.result_bullet_points ?? []) as string[];
          return (
            <section className="section" key={`case-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="card" style={cardStyle}>
                  {(block.content.company || block.content.source_url || block.content.provider || block.content.country) && (
                    <p className="case-meta">
                      {block.content.company && <strong>{block.content.company}</strong>}
                      {block.content.provider && (
                        <span> · Партнер: {block.content.provider}</span>
                      )}
                      {block.content.country && <span> · {block.content.country}</span>}
                      {block.content.source_url && (
                        <a href={block.content.source_url} target="_blank" rel="noreferrer">
                          Источник
                        </a>
                      )}
                    </p>
                  )}
                  {block.content.is_public === false && (
                    <p className="case-note">Кейс из практики без раскрытия клиента.</p>
                  )}
                  <p>{block.content.story}</p>
                  <ul>
                    {bullets.map((item, itemIndex) => (
                      <li key={`case-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "cases") {
          if (!cases || cases.length === 0) return null;
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`cases-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title ?? "Кейсы"}</h2>
                {block.content.subtitle && (
                  <p className="section-subtitle">{block.content.subtitle}</p>
                )}
                <div className="grid">
                  {cases.map((item) => (
                    <div className="card" key={item.id} style={cardStyle}>
                      <h3>{item.title}</h3>
                      {item.industry && <p>Отрасль: {item.industry}</p>}
                      {item.result && <p>Результат: {item.result}</p>}
                      {item.metrics && <p>Метрики: {item.metrics}</p>}
                      <a className="btn btn-secondary" href={`/cases/${item.slug}`}>
                        Открыть кейс
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "articles") {
          if (!articles || articles.length === 0) return null;
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`articles-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title ?? "Статьи"}</h2>
                {block.content.subtitle && (
                  <p className="section-subtitle">{block.content.subtitle}</p>
                )}
                <div className="grid">
                  {articles.map((article) => (
                    <div className="card" key={article.id} style={cardStyle}>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt ?? "Описание появится после редактирования."}</p>
                      <a className="btn btn-secondary" href={`/articles/${article.slug}`}>
                        Читать статью
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === "image") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          const avifUrl = block.content.image_avif_url as string | undefined;
          const webpUrl = block.content.image_webp_url as string | undefined;
          const jpgUrl = block.content.image_url as string | undefined;
          return (
            <section className="section" key={`image-${index}`} id={sectionId}>
              <div className="container builder-image">
                <div className="card" style={cardStyle}>
                  <h2 className="section-title">{block.content.title}</h2>
                  <p className="section-subtitle">{block.content.text}</p>
                </div>
                {(avifUrl || webpUrl || jpgUrl) && (
                  <div className="card" style={cardStyle}>
                    <picture>
                      {avifUrl && <source srcSet={avifUrl} type="image/avif" />}
                      {webpUrl && <source srcSet={webpUrl} type="image/webp" />}
                      {jpgUrl && <img src={jpgUrl} alt={block.content.title ?? "image"} />}
                    </picture>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (block.block_type === "contact") {
          const hasContacts =
            Boolean(contacts?.telegram) ||
            Boolean(contacts?.email) ||
            Boolean(contacts?.phone) ||
            Boolean(contacts?.address) ||
            socialLinks.length > 0 ||
            Boolean(policyUrl);
          return (
            <section className="section" id="contact" key={`contact-${index}`}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <p className="section-subtitle">{block.content.subtitle}</p>
                <div className="grid">
                  <div className="card" style={cardStyle}>
                    <LeadForm sourcePage={sourcePage} />
                  </div>
                  {hasContacts && (
                    <div className="card" style={cardStyle}>
                      <h3>Контакты</h3>
                      {contacts?.telegram && <p>Telegram: {contacts.telegram}</p>}
                      {contacts?.email && <p>Email: {contacts.email}</p>}
                      {contacts?.phone && <p>Телефон: {contacts.phone}</p>}
                      {contacts?.address && <p>Адрес: {contacts.address}</p>}
                      {socialLinks.length > 0 && (
                        <div className="footer-links">
                          {socialLinks.map((item) => (
                            <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                              {item.label}
                            </a>
                          ))}
                        </div>
                      )}
                      {policyUrl && (
                        <div className="footer-links" style={{ marginTop: 12 }}>
                          <a href={policyUrl} target="_blank" rel="noreferrer">
                            Политика обработки персональных данных
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </>
  );
}

type RichBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][]; header?: string[] };

/**
 * Build social links list from settings data.
 */
function buildSocialLinks(social?: SiteBlocksProps["social"]): SocialLink[] {
  const links: SocialLink[] = [];
  if (social?.telegram_url) {
    links.push({ label: "Telegram", href: social.telegram_url });
  }
  if (social?.vk_url) {
    links.push({ label: "VK", href: social.vk_url });
  }
  if (social?.youtube_url) {
    links.push({ label: "YouTube", href: social.youtube_url });
  }
  if (social?.instagram_url) {
    links.push({ label: "Instagram", href: social.instagram_url });
  }
  return links;
}

/**
 * Render rich text with paragraphs, lists, and tables.
 */
function renderRichText(value?: string) {
  const blocks = parseRichTextBlocks(value);
  if (blocks.length === 0) return null;

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`list-${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          return (
            <table key={`table-${index}`}>
              {block.header && (
                <thead>
                  <tr>
                    {block.header.map((cell, cellIndex) => (
                      <th key={`th-${index}-${cellIndex}`}>{cell}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={`row-${index}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`cell-${index}-${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        return <p key={`p-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}

function parseRichTextBlocks(value?: string): RichBlock[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/);
  const blocks: RichBlock[] = [];
  let tableRows: string[][] = [];
  let listItems: string[] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const header = isHeaderRow(tableRows[0]) ? tableRows[0] : undefined;
    const bodyRows = header ? tableRows.slice(1) : tableRows;
    blocks.push({ type: "table", rows: bodyRows, header });
    tableRows = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushTable();
      flushList();
      continue;
    }

    if (isListLine(trimmed)) {
      flushTable();
      listItems.push(trimmed.replace(/^[-—•]\s+/, ""));
      continue;
    }

    const row = parseTableRow(trimmed);
    if (row) {
      flushList();
      tableRows.push(row);
      continue;
    }

    flushTable();
    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
  }

  flushTable();
  flushList();

  return blocks;
}

function isListLine(line: string) {
  return /^[-—•]\s+/.test(line);
}

function parseTableRow(line: string) {
  if (line.includes("\t")) {
    const cells = line
      .split(/\t+/)
      .map((cell) => cell.trim())
      .filter(Boolean);
    return cells.length >= 2 ? cells : null;
  }

  const cells = line
    .split(/\s{2,}/)
    .map((cell) => cell.trim())
    .filter(Boolean);
  return cells.length >= 2 ? cells : null;
}

function isHeaderRow(row: string[]) {
  const headerHints = ["цель", "персон", "правовые", "виды", "данные"];
  return row.some((cell) =>
    headerHints.some((hint) => cell.toLowerCase().includes(hint))
  );
}
