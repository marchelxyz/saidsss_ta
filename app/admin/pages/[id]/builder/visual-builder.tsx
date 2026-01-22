"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LeadForm from "@/app/components/LeadForm";

type PageData = {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  niche: string | null;
  meta_description: string | null;
  published: boolean;
};

type BlockData = {
  id?: string;
  block_type: string;
  content: Record<string, any>;
  style?: Record<string, any>;
  sort_order?: number;
};

type VisualBuilderProps = {
  initialPage: PageData;
  initialBlocks: BlockData[];
};

export default function VisualBuilder({ initialPage, initialBlocks }: VisualBuilderProps) {
  const router = useRouter();
  const [page, setPage] = useState<PageData>(initialPage);
  const [blocks, setBlocks] = useState<BlockData[]>(() =>
    initialBlocks.map((block, index) => ({
      ...block,
      sort_order: block.sort_order ?? index
    }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string>("");

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [blocks]
  );

  const updateBlockContent = (index: number, key: string, value: unknown) => {
    setBlocks((prev) =>
      prev.map((block, idx) =>
        idx === index
          ? { ...block, content: { ...block.content, [key]: value } }
          : block
      )
    );
  };

  const updateBlockStyle = (index: number, key: string, value: unknown) => {
    setBlocks((prev) =>
      prev.map((block, idx) =>
        idx === index
          ? { ...block, style: { ...block.style, [key]: value } }
          : block
      )
    );
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setBlocks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated.map((block, idx) => ({ ...block, sort_order: idx }));
    });
    setDragIndex(null);
  };

  const generateImageForBlock = async (index: number) => {
    const prompt = (blocks[index]?.content?.image_prompt as string | undefined) ?? "";
    if (!prompt.trim()) return;
    setGeneratingIndex(index);
    setGenerateError("");
    try {
      const response = await fetch("/api/admin/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = (await response.json().catch(() => ({}))) as {
        urls?: { avif?: string; webp?: string; jpg?: string };
        message?: string;
      };
      if (!response.ok) {
        setGenerateError(data.message ?? "Не удалось сгенерировать изображение.");
        return;
      }
      if (!data.urls) {
        setGenerateError("Сервис не вернул ссылки на изображения.");
        return;
      }
      updateBlockContent(index, "image_avif_url", data.urls.avif ?? "");
      updateBlockContent(index, "image_webp_url", data.urls.webp ?? "");
      updateBlockContent(index, "image_url", data.urls.jpg ?? "");
    } finally {
      setGeneratingIndex((current) => (current === index ? null : current));
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/admin/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          pageType: page.page_type,
          niche: page.niche,
          metaDescription: page.meta_description,
          published: page.published,
          blocks: sortedBlocks.map((block, index) => ({
            block_type: block.block_type,
            content: block.content,
            style: block.style ?? {},
            sort_order: index
          }))
        })
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="builder-shell">
      <div className="builder-toolbar">
        <div>
          <strong>TeleAgent</strong>
          <span className="builder-hint">Визуальный редактор</span>
        </div>
        <div className="builder-actions">
          <input
            className="builder-input"
            value={page.title}
            onChange={(event) => setPage((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Название страницы"
          />
          <button className="btn" type="button" onClick={save} disabled={isSaving}>
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
          <a className="btn btn-secondary" href="/admin/pages">
            Назад
          </a>
        </div>
      </div>

      <main className="builder-canvas">
        <header className="container nav">
          <strong>TeleAgent</strong>
          <nav className="nav-links">
            <a href="#contact">Контакты</a>
          </nav>
          <a className="btn btn-secondary" href="#contact">
            Обсудить проект
          </a>
        </header>

        {sortedBlocks.map((block, index) => {
          const radius = block.style?.radius ? `${block.style.radius}px` : undefined;
          const cardStyle = radius ? { borderRadius: radius } : undefined;
          const keyBase = `block-${index}`;

          return (
            <section
              key={`${block.block_type}-${index}`}
              className={`builder-block ${dragIndex === index ? "is-dragging" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
            >
              <div
                className="builder-handle"
                title="Перетащить"
                draggable
                onDragStart={() => setDragIndex(index)}
              >
                ⋮⋮
              </div>

              {block.block_type === "hero" && (
                <div className="hero builder-live">
                  <div className="container hero-grid">
                    <div>
                      <h1
                        className="builder-editable"
                        contentEditable={editingKey === `${keyBase}-hero-title`}
                        suppressContentEditableWarning
                        onDoubleClick={() => setEditingKey(`${keyBase}-hero-title`)}
                        onBlur={(event) => {
                          updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                          setEditingKey(null);
                        }}
                      >
                        {block.content.title}
                      </h1>
                      <p
                        className="builder-editable"
                        contentEditable={editingKey === `${keyBase}-hero-subtitle`}
                        suppressContentEditableWarning
                        onDoubleClick={() => setEditingKey(`${keyBase}-hero-subtitle`)}
                        onBlur={(event) => {
                          updateBlockContent(
                            index,
                            "subtitle",
                            event.currentTarget.textContent ?? ""
                          );
                          setEditingKey(null);
                        }}
                      >
                        {block.content.subtitle}
                      </p>
                      <div className="button-row">
                        <a className="btn" href={block.content.button_link ?? "#contact"}>
                          <span
                            className="builder-editable"
                            contentEditable={editingKey === `${keyBase}-hero-button`}
                            suppressContentEditableWarning
                            onDoubleClick={() => setEditingKey(`${keyBase}-hero-button`)}
                            onBlur={(event) => {
                              updateBlockContent(
                                index,
                                "button_text",
                                event.currentTarget.textContent ?? ""
                              );
                              setEditingKey(null);
                            }}
                          >
                            {block.content.button_text ?? "Получить аудит"}
                          </span>
                        </a>
                      </div>
                    </div>
                    <div className="card" style={cardStyle}>
                      <strong>TeleAgent</strong>
                      <p>Аудит, внедрение и обучение под ключ.</p>
                    </div>
                  </div>
                </div>
              )}

              {block.block_type === "text" && (
                <div className="section builder-live">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-text-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-text-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title}
                    </h2>
                    <p
                      className="section-subtitle builder-editable"
                      contentEditable={editingKey === `${keyBase}-text-body`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-text-body`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "text", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.text}
                    </p>
                  </div>
                </div>
              )}

              {block.block_type === "list" && (
                <div className="section builder-live">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-list-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-list-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title}
                    </h2>
                    <div className="grid">
                      {(block.content.items ?? []).map((item: string, itemIndex: number) => (
                        <div className="card" style={cardStyle} key={`item-${itemIndex}`}>
                          <p
                            className="builder-editable"
                            contentEditable={
                              editingKey === `${keyBase}-list-item-${itemIndex}`
                            }
                            suppressContentEditableWarning
                            onDoubleClick={() =>
                              setEditingKey(`${keyBase}-list-item-${itemIndex}`)
                            }
                            onBlur={(event) => {
                              const updated = [...(block.content.items ?? [])];
                              updated[itemIndex] = event.currentTarget.textContent ?? "";
                              updateBlockContent(index, "items", updated);
                              setEditingKey(null);
                            }}
                          >
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => {
                        const updated = [...(block.content.items ?? [])];
                        updated.push("Новый пункт");
                        updateBlockContent(index, "items", updated);
                      }}
                    >
                      Добавить пункт
                    </button>
                  </div>
                </div>
              )}

              {block.block_type === "image" && (
                <div className="section builder-live">
                  <div className="container builder-image">
                    <div className="card" style={cardStyle}>
                      <h2
                        className="section-title builder-editable"
                        contentEditable={editingKey === `${keyBase}-image-title`}
                        suppressContentEditableWarning
                        onDoubleClick={() => setEditingKey(`${keyBase}-image-title`)}
                        onBlur={(event) => {
                          updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                          setEditingKey(null);
                        }}
                      >
                        {block.content.title}
                      </h2>
                      <p
                        className="section-subtitle builder-editable"
                        contentEditable={editingKey === `${keyBase}-image-text`}
                        suppressContentEditableWarning
                        onDoubleClick={() => setEditingKey(`${keyBase}-image-text`)}
                        onBlur={(event) => {
                          updateBlockContent(index, "text", event.currentTarget.textContent ?? "");
                          setEditingKey(null);
                        }}
                      >
                        {block.content.text}
                      </p>
                      <label className="builder-label">URL изображения</label>
                      <input
                        className="builder-input"
                        value={block.content.image_url ?? ""}
                        onChange={(event) =>
                          updateBlockContent(index, "image_url", event.target.value)
                        }
                        placeholder="https://..."
                      />
                      <label className="builder-label">Промпт для генерации</label>
                      <textarea
                        className="builder-input"
                        value={block.content.image_prompt ?? ""}
                        onChange={(event) =>
                          updateBlockContent(index, "image_prompt", event.target.value)
                        }
                        placeholder="Например: инфографика, процесс, темный фон..."
                      />
                      <button
                        className="btn btn-secondary builder-inline-button"
                        type="button"
                        onClick={() => generateImageForBlock(index)}
                        disabled={generatingIndex === index}
                      >
                        {generatingIndex === index ? "Генерируем..." : "Сгенерировать"}
                      </button>
                      {generateError && <p className="error">{generateError}</p>}
                    </div>
                    {(block.content.image_avif_url ||
                      block.content.image_webp_url ||
                      block.content.image_url) && (
                      <div className="card" style={cardStyle}>
                        <picture>
                          {block.content.image_avif_url && (
                            <source
                              srcSet={block.content.image_avif_url}
                              type="image/avif"
                            />
                          )}
                          {block.content.image_webp_url && (
                            <source
                              srcSet={block.content.image_webp_url}
                              type="image/webp"
                            />
                          )}
                          {block.content.image_url && (
                            <img
                              src={block.content.image_url}
                              alt={block.content.title ?? "image"}
                            />
                          )}
                        </picture>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {block.block_type === "contact" && (
                <div className="section builder-live" id="contact">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-contact-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-contact-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title}
                    </h2>
                    <p
                      className="section-subtitle builder-editable"
                      contentEditable={editingKey === `${keyBase}-contact-subtitle`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-contact-subtitle`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "subtitle", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.subtitle}
                    </p>
                    <div className="card" style={cardStyle}>
                      <LeadForm sourcePage={page.slug} />
                    </div>
                  </div>
                </div>
              )}

              <div className="builder-style">
                <label>Скругление (px)</label>
                <input
                  type="number"
                  value={block.style?.radius ?? 16}
                  onChange={(event) =>
                    updateBlockStyle(index, "radius", Number(event.target.value))
                  }
                />
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
