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
};

export default function SiteBlocks({ blocks, sourcePage }: SiteBlocksProps) {
  const getSectionId = (title?: string, fallback?: string) => {
    const base = title?.toString().trim() || fallback || "";
    return base ? slugify(base) : undefined;
  };

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
                  <p>Аудит, внедрение и обучение под ключ.</p>
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
                <p className="section-subtitle">{block.content.text}</p>
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
                      {item.loss_amount && (
                        <p className="loss">-{item.loss_amount}</p>
                      )}
                    </div>
                  ))}
                </div>
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
          return (
            <section className="section" key={`roi-${index}`} id={sectionId}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <strong>{block.content.hours_saved_per_month}</strong>
                    <span>часов в месяц</span>
                  </div>
                  <div className="stat-card">
                    <strong>{block.content.money_saved_per_year}₽</strong>
                    <span>экономия в год</span>
                  </div>
                  <div className="stat-card">
                    <strong>{block.content.roi_percentage}%</strong>
                    <span>ROI</span>
                  </div>
                  <div className="stat-card">
                    <strong>{block.content.payback_period_months} мес</strong>
                    <span>окупаемость</span>
                  </div>
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

        if (block.block_type === "image") {
          const sectionId = getSectionId(block.content.title as string | undefined);
          return (
            <section className="section" key={`image-${index}`} id={sectionId}>
              <div className="container builder-image">
                <div className="card" style={cardStyle}>
                  <h2 className="section-title">{block.content.title}</h2>
                  <p className="section-subtitle">{block.content.text}</p>
                </div>
                {block.content.image_url && (
                  <div className="card" style={cardStyle}>
                    <img src={block.content.image_url} alt={block.content.title ?? "image"} />
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (block.block_type === "contact") {
          return (
            <section className="section" id="contact" key={`contact-${index}`}>
              <div className="container">
                <h2 className="section-title">{block.content.title}</h2>
                <p className="section-subtitle">{block.content.subtitle}</p>
                <div className="card" style={cardStyle}>
                  <LeadForm sourcePage={sourcePage} />
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
