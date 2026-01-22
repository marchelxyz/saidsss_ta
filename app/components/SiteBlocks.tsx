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
