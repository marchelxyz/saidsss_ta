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

const BLOCK_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "text", label: "Текст" },
  { value: "list", label: "Список" },
  { value: "image", label: "Изображение" },
  { value: "contact", label: "Контакты" }
];

const buildDefaultBlock = (type: string): BlockData => {
  switch (type) {
    case "hero":
      return {
        block_type: "hero",
        content: {
          title: "TeleAgent — трансформация бизнеса с AI",
          subtitle: "Аудит, внедрение и обучение под ключ.",
          button_text: "Получить аудит",
          button_link: "#contact"
        },
        style: { radius: 18 }
      };
    case "list":
      return {
        block_type: "list",
        content: {
          title: "Ключевые боли",
          items: ["Пункт 1", "Пункт 2", "Пункт 3"]
        },
        style: { radius: 16 }
      };
    case "image":
      return {
        block_type: "image",
        content: {
          title: "Блок с изображением",
          text: "Описание блока",
          image_url: ""
        },
        style: { radius: 16 }
      };
    case "contact":
      return {
        block_type: "contact",
        content: {
          title: "Обсудим проект",
          subtitle: "Оставьте контакты — вернемся с планом аудита."
        },
        style: { radius: 16 }
      };
    case "text":
    default:
      return {
        block_type: "text",
        content: {
          title: "Заголовок секции",
          text: "Текст блока"
        },
        style: { radius: 16 }
      };
  }
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
  const [newBlockType, setNewBlockType] = useState("text");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

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

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { ...buildDefaultBlock(newBlockType), sort_order: prev.length }
    ]);
  };

  const addBaseTemplate = () => {
    const template = ["hero", "text", "list", "contact"].map((type, index) => ({
      ...buildDefaultBlock(type),
      sort_order: index
    }));
    setBlocks(template);
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
        <div className="builder-panel container">
          <div className="builder-panel-row">
            <select
              className="builder-input"
              value={newBlockType}
              onChange={(event) => setNewBlockType(event.target.value)}
            >
              {BLOCK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button className="btn" type="button" onClick={addBlock}>
              Добавить блок
            </button>
            <button className="btn btn-secondary" type="button" onClick={addBaseTemplate}>
              Базовый шаблон
            </button>
          </div>
        </div>

        <header className="container nav">
          <strong>TeleAgent</strong>
          <nav className="nav-links">
            <a href="#contact">Контакты</a>
          </nav>
          <a className="btn btn-secondary" href="#contact">
            Обсудить проект
          </a>
        </header>

        {sortedBlocks.length === 0 && (
          <div className="container">
            <div className="admin-card" style={{ marginTop: 24 }}>
              Блоков пока нет. Добавьте блок или примените базовый шаблон.
            </div>
          </div>
        )}

        {sortedBlocks.map((block, index) => {
          const radius = block.style?.radius ? `${block.style.radius}px` : undefined;
          const cardStyle = radius ? { borderRadius: radius } : undefined;
          const keyBase = `block-${index}`;

          return (
            <section
              key={`${block.block_type}-${index}`}
              className={`builder-block ${dragIndex === index ? "is-dragging" : ""}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
            >
              <div className="builder-handle" title="Перетащить">
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
                    </div>
                    {block.content.image_url && (
                      <div className="card" style={cardStyle}>
                        <img src={block.content.image_url} alt={block.content.title ?? "image"} />
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
