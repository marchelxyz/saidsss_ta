"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LeadForm from "@/app/components/LeadForm";
import { buildNavItemsFromBlocks } from "@/lib/blocks";

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

type BlockOption = {
  value: string;
  label: string;
};

type DragItem = {
  blockIndex: number;
  itemIndex: number;
};

type DragStep = {
  blockIndex: number;
  stepIndex: number;
};

type VisualBuilderProps = {
  initialPage: PageData;
  initialBlocks: BlockData[];
};

type SettingsData = {
  telegram?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  legal_address?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  kpp?: string | null;
  policy_url?: string | null;
  vk_url?: string | null;
  telegram_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
};

const BLOCK_OPTIONS: BlockOption[] = [
  { value: "hero", label: "Hero" },
  { value: "text", label: "Текст" },
  { value: "list", label: "Список" },
  { value: "faq", label: "FAQ" },
  { value: "process_map", label: "Процесс (схема)" },
  { value: "cases", label: "Кейсы" },
  { value: "articles", label: "Статьи" },
  { value: "image", label: "Изображение" },
  { value: "contact", label: "Контакты" }
];

/**
 * Build a default block structure for the visual builder.
 */
function buildDefaultBlock(type: string): BlockData {
  switch (type) {
    case "hero":
      return {
        block_type: "hero",
        content: {
          title: "Заголовок",
          subtitle: "Подзаголовок",
          button_text: "Получить аудит",
          button_link: "#contact"
        },
        style: { radius: 18 }
      };
    case "list":
      return {
        block_type: "list",
        content: {
          title: "Список",
          items: ["Пункт 1", "Пункт 2", "Пункт 3"]
        },
        style: { radius: 16 }
      };
    case "faq":
      return {
        block_type: "faq",
        content: {
          title: "FAQ",
          items: [
            { question: "Вопрос 1", answer: "Ответ 1" },
            { question: "Вопрос 2", answer: "Ответ 2" }
          ]
        },
        style: { radius: 16 }
      };
    case "process_map":
      return {
        block_type: "process_map",
        content: {
          title: "Как выглядит процесс",
          steps: [
            {
              title: "Шаг 1",
              subtitle: "Короткое пояснение",
              items: ["Подшаг 1"]
            }
          ],
          result: {
            title: "Результат",
            subtitle: "Автоматизированный бизнес"
          }
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
    case "cases":
      return {
        block_type: "cases",
        content: {
          title: "Кейсы",
          subtitle: "Реальные примеры внедрения AI и автоматизаций для бизнеса."
        },
        style: { radius: 16 }
      };
    case "articles":
      return {
        block_type: "articles",
        content: {
          title: "Статьи",
          subtitle: "Практика, разборы кейсов и подходы к AI-трансформации бизнеса."
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
}

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
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragStep, setDragStep] = useState<DragStep | null>(null);
  const [newBlockType, setNewBlockType] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string>("");
  const [blockGeneratingIndex, setBlockGeneratingIndex] = useState<number | null>(null);
  const [blockGenerateError, setBlockGenerateError] = useState<string>("");
  const [settings, setSettings] = useState<SettingsData | null>(null);

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [blocks]
  );
  const navItems = useMemo(() => buildNavItemsFromBlocks(sortedBlocks), [sortedBlocks]);

  useEffect(() => {
    const loadSettings = async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) return;
      const data = (await response.json().catch(() => ({}))) as {
        settings?: SettingsData;
      };
      if (data.settings) {
        setSettings(data.settings);
      }
    };
    loadSettings().catch(() => undefined);
  }, []);

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

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { ...buildDefaultBlock(newBlockType), sort_order: prev.length }
    ]);
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, idx) => idx !== index));
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

  const moveBlockItem = (blockIndex: number, fromIndex: number, toIndex: number) => {
    setBlocks((prev) =>
      prev.map((block, idx) => {
        if (idx !== blockIndex) return block;
        const items = [...(block.content.items ?? [])];
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        return { ...block, content: { ...block.content, items } };
      })
    );
  };

  const handleItemDrop = (blockIndex: number, itemIndex: number) => {
    if (!dragItem || dragItem.blockIndex !== blockIndex) return;
    if (dragItem.itemIndex === itemIndex) return;
    moveBlockItem(blockIndex, dragItem.itemIndex, itemIndex);
    setDragItem(null);
  };

  const moveProcessStep = (blockIndex: number, fromIndex: number, toIndex: number) => {
    setBlocks((prev) =>
      prev.map((block, idx) => {
        if (idx !== blockIndex) return block;
        const steps = [...(block.content.steps ?? [])];
        const [moved] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, moved);
        return { ...block, content: { ...block.content, steps } };
      })
    );
  };

  const handleStepDrop = (blockIndex: number, stepIndex: number) => {
    if (!dragStep || dragStep.blockIndex !== blockIndex) return;
    if (dragStep.stepIndex === stepIndex) return;
    moveProcessStep(blockIndex, dragStep.stepIndex, stepIndex);
    setDragStep(null);
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

  const generateTextForBlock = async (index: number) => {
    const block = blocks[index];
    if (!block) return;
    setBlockGeneratingIndex(index);
    setBlockGenerateError("");
    try {
      const response = await fetch("/api/admin/ai/block-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType: block.block_type,
          pageTitle: page.title,
          niche: page.niche,
          content: block.content
        })
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        content?: Record<string, unknown>;
        message?: string;
      };
      if (!response.ok || !data.ok || !data.content) {
        setBlockGenerateError(data.message ?? "Не удалось сгенерировать текст.");
        return;
      }
      setBlocks((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, content: { ...item.content, ...data.content } } : item
        )
      );
    } finally {
      setBlockGeneratingIndex((current) => (current === index ? null : current));
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
          <select
            className="builder-input"
            value={newBlockType}
            onChange={(event) => setNewBlockType(event.target.value)}
          >
            {BLOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" type="button" onClick={addBlock}>
            Добавить блок
          </button>
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
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.title}
              </a>
            ))}
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
                      <input
                        className="builder-input"
                        value={block.content.button_link ?? "#contact"}
                        onChange={(event) =>
                          updateBlockContent(index, "button_link", event.target.value)
                        }
                        placeholder="Ссылка кнопки"
                      />
                      <button
                        className="btn btn-secondary builder-inline-button"
                        type="button"
                        onClick={() => generateTextForBlock(index)}
                        disabled={blockGeneratingIndex === index}
                      >
                        {blockGeneratingIndex === index ? "Генерируем..." : "AI заполнить"}
                      </button>
                      {blockGenerateError && blockGeneratingIndex === index && (
                        <p className="error">{blockGenerateError}</p>
                      )}
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
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => generateTextForBlock(index)}
                      disabled={blockGeneratingIndex === index}
                    >
                      {blockGeneratingIndex === index ? "Генерируем..." : "AI заполнить"}
                    </button>
                    {blockGenerateError && blockGeneratingIndex === index && (
                      <p className="error">{blockGenerateError}</p>
                    )}
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
                        <div
                          className="card builder-item"
                          style={cardStyle}
                          key={`item-${itemIndex}`}
                          draggable
                          onDragStart={() => setDragItem({ blockIndex: index, itemIndex })}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleItemDrop(index, itemIndex)}
                        >
                          <div className="builder-item-handle" title="Перетащить">
                            ⋮⋮
                          </div>
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
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => generateTextForBlock(index)}
                      disabled={blockGeneratingIndex === index}
                    >
                      {blockGeneratingIndex === index ? "Генерируем..." : "AI заполнить"}
                    </button>
                    {blockGenerateError && blockGeneratingIndex === index && (
                      <p className="error">{blockGenerateError}</p>
                    )}
                  </div>
                </div>
              )}

              {block.block_type === "faq" && (
                <div className="section builder-live">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-faq-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-faq-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title}
                    </h2>
                    <div className="faq">
                      {(block.content.items ?? []).map(
                        (item: { question?: string; answer?: string }, itemIndex: number) => (
                          <details
                            className="card builder-item"
                            key={`faq-${itemIndex}`}
                            draggable
                            onDragStart={() => setDragItem({ blockIndex: index, itemIndex })}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleItemDrop(index, itemIndex)}
                          >
                            <div className="builder-item-handle" title="Перетащить">
                              ⋮⋮
                            </div>
                            <summary
                              className="builder-editable"
                              contentEditable={editingKey === `${keyBase}-faq-q-${itemIndex}`}
                              suppressContentEditableWarning
                              onDoubleClick={() =>
                                setEditingKey(`${keyBase}-faq-q-${itemIndex}`)
                              }
                              onBlur={(event) => {
                                const updated = [...(block.content.items ?? [])];
                                updated[itemIndex] = {
                                  ...updated[itemIndex],
                                  question: event.currentTarget.textContent ?? ""
                                };
                                updateBlockContent(index, "items", updated);
                                setEditingKey(null);
                              }}
                            >
                              {item.question}
                            </summary>
                            <p
                              className="builder-editable"
                              contentEditable={editingKey === `${keyBase}-faq-a-${itemIndex}`}
                              suppressContentEditableWarning
                              onDoubleClick={() =>
                                setEditingKey(`${keyBase}-faq-a-${itemIndex}`)
                              }
                              onBlur={(event) => {
                                const updated = [...(block.content.items ?? [])];
                                updated[itemIndex] = {
                                  ...updated[itemIndex],
                                  answer: event.currentTarget.textContent ?? ""
                                };
                                updateBlockContent(index, "items", updated);
                                setEditingKey(null);
                              }}
                            >
                              {item.answer}
                            </p>
                          </details>
                        )
                      )}
                    </div>
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => {
                        const updated = [...(block.content.items ?? [])];
                        updated.push({ question: "Новый вопрос", answer: "Новый ответ" });
                        updateBlockContent(index, "items", updated);
                      }}
                    >
                      Добавить вопрос
                    </button>
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => generateTextForBlock(index)}
                      disabled={blockGeneratingIndex === index}
                    >
                      {blockGeneratingIndex === index ? "Генерируем..." : "AI заполнить"}
                    </button>
                    {blockGenerateError && blockGeneratingIndex === index && (
                      <p className="error">{blockGenerateError}</p>
                    )}
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

              {block.block_type === "cases" && (
                <div className="section builder-live">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-cases-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-cases-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title ?? "Кейсы"}
                    </h2>
                    <p
                      className="section-subtitle builder-editable"
                      contentEditable={editingKey === `${keyBase}-cases-subtitle`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-cases-subtitle`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "subtitle", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.subtitle ?? "Опубликованные кейсы появятся на сайте."}
                    </p>
                    <div className="grid">
                      <div className="card" style={cardStyle}>
                        <strong>Кейс</strong>
                        <p>Здесь будут карточки опубликованных кейсов.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {block.block_type === "articles" && (
                <div className="section builder-live">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-articles-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-articles-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title ?? "Статьи"}
                    </h2>
                    <p
                      className="section-subtitle builder-editable"
                      contentEditable={editingKey === `${keyBase}-articles-subtitle`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-articles-subtitle`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "subtitle", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.subtitle ?? "Опубликованные статьи появятся на сайте."}
                    </p>
                    <div className="grid">
                      <div className="card" style={cardStyle}>
                        <strong>Статья</strong>
                        <p>Здесь будут карточки опубликованных статей.</p>
                      </div>
                    </div>
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
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => generateTextForBlock(index)}
                      disabled={blockGeneratingIndex === index}
                    >
                      {blockGeneratingIndex === index ? "Генерируем..." : "AI заполнить"}
                    </button>
                    {blockGenerateError && blockGeneratingIndex === index && (
                      <p className="error">{blockGenerateError}</p>
                    )}
                  </div>
                </div>
              )}

              {block.block_type === "process_map" && (
                <div className="section builder-live process-map">
                  <div className="container">
                    <h2
                      className="section-title builder-editable"
                      contentEditable={editingKey === `${keyBase}-process-title`}
                      suppressContentEditableWarning
                      onDoubleClick={() => setEditingKey(`${keyBase}-process-title`)}
                      onBlur={(event) => {
                        updateBlockContent(index, "title", event.currentTarget.textContent ?? "");
                        setEditingKey(null);
                      }}
                    >
                      {block.content.title}
                    </h2>
                    <div className="process-map-track builder-process">
                      {(block.content.steps ?? []).map(
                        (
                          step: { title?: string; subtitle?: string; items?: string[] },
                          stepIndex: number
                        ) => (
                          <div
                            className="process-step builder-item"
                            key={`process-${stepIndex}`}
                            draggable
                            onDragStart={() => setDragStep({ blockIndex: index, stepIndex })}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleStepDrop(index, stepIndex)}
                          >
                            <div className="builder-item-handle" title="Перетащить">
                              ⋮⋮
                            </div>
                            <div className="process-node">
                              <span className="process-index">{stepIndex + 1}</span>
                              <h3
                                className="builder-editable"
                                contentEditable={
                                  editingKey === `${keyBase}-process-title-${stepIndex}`
                                }
                                suppressContentEditableWarning
                                onDoubleClick={() =>
                                  setEditingKey(`${keyBase}-process-title-${stepIndex}`)
                                }
                                onBlur={(event) => {
                                  const updated = [...(block.content.steps ?? [])];
                                  updated[stepIndex] = {
                                    ...updated[stepIndex],
                                    title: event.currentTarget.textContent ?? ""
                                  };
                                  updateBlockContent(index, "steps", updated);
                                  setEditingKey(null);
                                }}
                              >
                                {step.title}
                              </h3>
                              <p
                                className="builder-editable"
                                contentEditable={
                                  editingKey === `${keyBase}-process-sub-${stepIndex}`
                                }
                                suppressContentEditableWarning
                                onDoubleClick={() =>
                                  setEditingKey(`${keyBase}-process-sub-${stepIndex}`)
                                }
                                onBlur={(event) => {
                                  const updated = [...(block.content.steps ?? [])];
                                  updated[stepIndex] = {
                                    ...updated[stepIndex],
                                    subtitle: event.currentTarget.textContent ?? ""
                                  };
                                  updateBlockContent(index, "steps", updated);
                                  setEditingKey(null);
                                }}
                              >
                                {step.subtitle}
                              </p>
                            </div>
                            {(step.items ?? []).length > 0 && (
                              <div className="process-substeps">
                                {(step.items ?? []).map(
                                  (item: string, itemIndex: number) => (
                                    <div
                                      className="process-substep builder-editable"
                                      key={`process-item-${stepIndex}-${itemIndex}`}
                                      contentEditable={
                                        editingKey ===
                                        `${keyBase}-process-item-${stepIndex}-${itemIndex}`
                                      }
                                      suppressContentEditableWarning
                                      onDoubleClick={() =>
                                        setEditingKey(
                                          `${keyBase}-process-item-${stepIndex}-${itemIndex}`
                                        )
                                      }
                                      onBlur={(event) => {
                                        const updated = [...(block.content.steps ?? [])];
                                        const items = [...(updated[stepIndex]?.items ?? [])];
                                        items[itemIndex] = event.currentTarget.textContent ?? "";
                                        updated[stepIndex] = { ...updated[stepIndex], items };
                                        updateBlockContent(index, "steps", updated);
                                        setEditingKey(null);
                                      }}
                                    >
                                      {item}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            <button
                              className="btn btn-secondary builder-inline-button"
                              type="button"
                              onClick={() => {
                                const updated = [...(block.content.steps ?? [])];
                                const items = [...(updated[stepIndex]?.items ?? [])];
                                items.push("Новый подпункт");
                                updated[stepIndex] = { ...updated[stepIndex], items };
                                updateBlockContent(index, "steps", updated);
                              }}
                            >
                              Добавить подпункт
                            </button>
                          </div>
                        )
                      )}
                    </div>
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => {
                        const updated = [...(block.content.steps ?? [])];
                        updated.push({
                          title: "Новый шаг",
                          subtitle: "Пояснение",
                          items: ["Подшаг"]
                        });
                        updateBlockContent(index, "steps", updated);
                      }}
                    >
                      Добавить шаг
                    </button>
                    <button
                      className="btn btn-secondary builder-inline-button"
                      type="button"
                      onClick={() => generateTextForBlock(index)}
                      disabled={blockGeneratingIndex === index}
                    >
                      {blockGeneratingIndex === index ? "Генерируем..." : "AI заполнить"}
                    </button>
                    {blockGenerateError && blockGeneratingIndex === index && (
                      <p className="error">{blockGenerateError}</p>
                    )}
                    {block.content.result && (
                      <div className="process-result">
                        <h3
                          className="builder-editable"
                          contentEditable={editingKey === `${keyBase}-process-result-title`}
                          suppressContentEditableWarning
                          onDoubleClick={() =>
                            setEditingKey(`${keyBase}-process-result-title`)
                          }
                          onBlur={(event) => {
                            updateBlockContent(index, "result", {
                              ...(block.content.result ?? {}),
                              title: event.currentTarget.textContent ?? ""
                            });
                            setEditingKey(null);
                          }}
                        >
                          {block.content.result.title}
                        </h3>
                        <p
                          className="builder-editable"
                          contentEditable={editingKey === `${keyBase}-process-result-subtitle`}
                          suppressContentEditableWarning
                          onDoubleClick={() =>
                            setEditingKey(`${keyBase}-process-result-subtitle`)
                          }
                          onBlur={(event) => {
                            updateBlockContent(index, "result", {
                              ...(block.content.result ?? {}),
                              subtitle: event.currentTarget.textContent ?? ""
                            });
                            setEditingKey(null);
                          }}
                        >
                          {block.content.result.subtitle}
                        </p>
                      </div>
                    )}
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
                <button
                  className="btn btn-secondary builder-inline-button"
                  type="button"
                  onClick={() => removeBlock(index)}
                >
                  Удалить
                </button>
              </div>
            </section>
          );
        })}
        {settings && (
          <footer className="footer">
            <div className="container footer-grid">
              <div>
                <strong>TeleAgent</strong>
                <p>Трансформация бизнеса с AI под ключ.</p>
              </div>
              <div>
                <strong>Контакты</strong>
                {settings.telegram && <p>Telegram: {settings.telegram}</p>}
                {settings.email && (
                  <p>
                    Email: <a href={buildPreviewEmailHref(settings.email)}>{settings.email}</a>
                  </p>
                )}
                {settings.phone && (
                  <p>
                    Телефон: <a href={buildPreviewPhoneHref(settings.phone)}>{settings.phone}</a>
                  </p>
                )}
                {settings.address && <p>Адрес: {settings.address}</p>}
                {buildPreviewLinks(settings).length > 0 && (
                  <div className="footer-links">
                    {buildPreviewLinks(settings).map((item) => (
                      <span key={item.label}>{renderPreviewSocialLink(item)}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <strong>Реквизиты</strong>
                {settings.company_name && <p>{settings.company_name}</p>}
                {settings.legal_address && <p>{settings.legal_address}</p>}
                {settings.inn && <p>ИНН: {settings.inn}</p>}
                {settings.kpp && <p>КПП: {settings.kpp}</p>}
                {settings.ogrn && <p>ОГРН: {settings.ogrn}</p>}
                {settings.policy_url && (
                  <div className="footer-links">
                    <a href={settings.policy_url} target="_blank" rel="noreferrer">
                      Политика обработки персональных данных
                    </a>
                  </div>
                )}
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

type PreviewLink = {
  label: string;
  href: string;
};

/**
 * Build social links for the footer preview.
 */
function buildPreviewLinks(settings: SettingsData): PreviewLink[] {
  const links: PreviewLink[] = [];
  if (settings.telegram_url) {
    links.push({ label: "Telegram", href: settings.telegram_url });
  }
  if (settings.vk_url) {
    links.push({ label: "VK", href: settings.vk_url });
  }
  if (settings.youtube_url) {
    links.push({ label: "YouTube", href: settings.youtube_url });
  }
  if (settings.instagram_url) {
    links.push({ label: "Instagram", href: settings.instagram_url });
  }
  return links;
}

/**
 * Render preview social link with icon for Telegram.
 */
function renderPreviewSocialLink(link: PreviewLink) {
  const isTelegram = link.label === "Telegram";
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={link.label}
      title={link.label}
    >
      {isTelegram ? renderPreviewTelegramIcon() : link.label}
    </a>
  );
}

/**
 * Render Telegram icon with current color for preview.
 */
function renderPreviewTelegramIcon() {
  return (
    <span className="footer-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" role="img">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z" />
      </svg>
    </span>
  );
}

/**
 * Build a mailto link for the preview footer.
 */
function buildPreviewEmailHref(email?: string | null) {
  return email ? `mailto:${email}` : "";
}

/**
 * Build a tel link for the preview footer.
 */
function buildPreviewPhoneHref(phone?: string | null) {
  if (!phone) return "";
  const normalized = phone.replace(/[^\d+]/g, "");
  return `tel:${normalized || phone}`;
}
