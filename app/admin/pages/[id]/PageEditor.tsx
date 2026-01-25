"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

type PageEditorProps = {
  initialPage: PageData;
  initialBlocks: BlockData[];
};

const BLOCK_TYPES = [
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


export default function PageEditor({ initialPage, initialBlocks }: PageEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState<PageData>(initialPage);
  const [blocks, setBlocks] = useState<BlockData[]>(() =>
    initialBlocks.map((block, index) => ({
      ...block,
      sort_order: block.sort_order ?? index
    }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [newBlockType, setNewBlockType] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string>("");

  const updateBlock = (index: number, patch: Partial<BlockData>) => {
    setBlocks((prev) =>
      prev.map((block, idx) => (idx === index ? { ...block, ...patch } : block))
    );
  };

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
          blocks: blocks.map((block, index) => ({
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
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Редактор страницы</h1>
        <div className="admin-actions">
          <a className="btn btn-secondary" href={`/admin/pages/${page.id}/builder`}>
            Визуальный редактор
          </a>
          <button className="btn" type="button" onClick={save} disabled={isSaving}>
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="admin-card admin-form" style={{ marginBottom: 24 }}>
        <label>Название</label>
        <input
          value={page.title}
          onChange={(event) => setPage((prev) => ({ ...prev, title: event.target.value }))}
        />
        <label>Slug</label>
        <input
          value={page.slug}
          onChange={(event) => setPage((prev) => ({ ...prev, slug: event.target.value }))}
        />
        <label>Тип</label>
        <select
          value={page.page_type}
          onChange={(event) => setPage((prev) => ({ ...prev, page_type: event.target.value }))}
        >
          <option value="home">home</option>
          <option value="industry">industry</option>
          <option value="custom">custom</option>
        </select>
        {page.page_type === "industry" && (
          <>
            <label>Ниша</label>
            <input
              value={page.niche ?? ""}
              onChange={(event) =>
                setPage((prev) => ({ ...prev, niche: event.target.value }))
              }
            />
          </>
        )}
        <label>Meta description</label>
        <textarea
          value={page.meta_description ?? ""}
          onChange={(event) =>
            setPage((prev) => ({ ...prev, meta_description: event.target.value }))
          }
          onInput={(event) => autoResizeTextArea(event.currentTarget)}
        />
        <label>Публикация</label>
        <select
          value={page.published ? "published" : "draft"}
          onChange={(event) =>
            setPage((prev) => ({ ...prev, published: event.target.value === "published" }))
          }
        >
          <option value="published">Опубликовано</option>
          <option value="draft">Черновик</option>
        </select>
      </div>

      <div className="admin-card">
        <div className="admin-inline">
          <select value={newBlockType} onChange={(event) => setNewBlockType(event.target.value)}>
            {BLOCK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button className="btn" type="button" onClick={addBlock}>
            Добавить блок
          </button>
        </div>
      </div>

      <div className="admin-block-list" style={{ marginTop: 20 }}>
        {blocks.map((block, index) => (
          <div
            key={`${block.block_type}-${index}`}
            className="admin-block"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
          >
            <div className="admin-block-header">
              <span
                className="admin-drag-handle"
                draggable
                onDragStart={() => setDragIndex(index)}
                title="Перетащить блок"
              >
                ⋮⋮
              </span>
              <strong>{BLOCK_TYPES.find((item) => item.value === block.block_type)?.label}</strong>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => removeBlock(index)}
              >
                Удалить
              </button>
            </div>

            <div className="admin-block-grid">
              <label>Закругление (px)</label>
              <input
                type="number"
                value={block.style?.radius ?? 16}
                onChange={(event) =>
                  updateBlockStyle(index, "radius", Number(event.target.value))
                }
              />

              {block.block_type === "hero" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Подзаголовок</label>
                  <textarea
                    value={block.content.subtitle ?? ""}
                    onChange={(event) => updateBlockContent(index, "subtitle", event.target.value)}
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                  <label>Текст кнопки</label>
                  <input
                    value={block.content.button_text ?? ""}
                    onChange={(event) =>
                      updateBlockContent(index, "button_text", event.target.value)
                    }
                  />
                  <label>Ссылка кнопки</label>
                  <input
                    value={block.content.button_link ?? ""}
                    onChange={(event) =>
                      updateBlockContent(index, "button_link", event.target.value)
                    }
                  />
                </>
              )}

              {block.block_type === "text" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Текст</label>
                  <textarea
                    value={block.content.text ?? ""}
                    onChange={(event) => updateBlockContent(index, "text", event.target.value)}
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}

              {block.block_type === "list" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Список (каждый пункт с новой строки)</label>
                  <textarea
                    value={listToText(block.content.items ?? [])}
                    onChange={(event) =>
                      updateBlockContent(index, "items", textToList(event.target.value))
                    }
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}

              {block.block_type === "faq" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Вопросы (формат: Вопрос :: Ответ, каждая пара с новой строки)</label>
                  <textarea
                    value={faqToText(block.content.items ?? [])}
                    onChange={(event) =>
                      updateBlockContent(index, "items", textToFaq(event.target.value))
                    }
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}

              {block.block_type === "process_map" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Шаги (формат: Шаг :: Подзаголовок :: Подшаг 1 | Подшаг 2)</label>
                  <textarea
                    value={processStepsToText(block.content.steps ?? [])}
                    onChange={(event) =>
                      updateBlockContent(index, "steps", textToProcessSteps(event.target.value))
                    }
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                  <label>Результат</label>
                  <input
                    value={block.content.result?.title ?? ""}
                    onChange={(event) =>
                      updateBlockContent(index, "result", {
                        ...(block.content.result ?? {}),
                        title: event.target.value
                      })
                    }
                  />
                  <label>Подзаголовок результата</label>
                  <textarea
                    value={block.content.result?.subtitle ?? ""}
                    onChange={(event) =>
                      updateBlockContent(index, "result", {
                        ...(block.content.result ?? {}),
                        subtitle: event.target.value
                      })
                    }
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}

              {block.block_type === "image" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Текст</label>
                  <textarea
                    value={block.content.text ?? ""}
                    onChange={(event) => updateBlockContent(index, "text", event.target.value)}
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                  <label>URL изображения</label>
                  <input
                    value={block.content.image_url ?? ""}
                    onChange={(event) => updateBlockContent(index, "image_url", event.target.value)}
                  />
                  <label>Промпт для генерации</label>
                  <textarea
                    value={block.content.image_prompt ?? ""}
                    onChange={(event) =>
                      updateBlockContent(index, "image_prompt", event.target.value)
                    }
                    placeholder="Например: инфографика, процесс, темный фон..."
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => generateImageForBlock(index)}
                    disabled={generatingIndex === index}
                  >
                    {generatingIndex === index ? "Генерируем..." : "Перегенерировать"}
                  </button>
                  {generateError && <p className="error">{generateError}</p>}
                </>
              )}

              {block.block_type === "cases" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Подзаголовок</label>
                  <textarea
                    value={block.content.subtitle ?? ""}
                    onChange={(event) => updateBlockContent(index, "subtitle", event.target.value)}
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}

              {block.block_type === "articles" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Подзаголовок</label>
                  <textarea
                    value={block.content.subtitle ?? ""}
                    onChange={(event) => updateBlockContent(index, "subtitle", event.target.value)}
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}

              {block.block_type === "contact" && (
                <>
                  <label>Заголовок</label>
                  <input
                    value={block.content.title ?? ""}
                    onChange={(event) => updateBlockContent(index, "title", event.target.value)}
                  />
                  <label>Подзаголовок</label>
                  <textarea
                    value={block.content.subtitle ?? ""}
                    onChange={(event) => updateBlockContent(index, "subtitle", event.target.value)}
                    onInput={(event) => autoResizeTextArea(event.currentTarget)}
                  />
                </>
              )}
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="admin-card">Добавьте блоки через конструктор.</div>
        )}
      </div>
    </div>
  );
}

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
          title: "Список преимуществ",
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
            { title: "Шаг 1", subtitle: "Короткое пояснение", items: ["Подшаг 1"] }
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

function listToText(items?: string[]) {
  return (items ?? []).join("\n");
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function faqToText(items?: Array<{ question?: string; answer?: string }>) {
  return (items ?? [])
    .map((item) => `${item.question ?? ""} :: ${item.answer ?? ""}`.trim())
    .join("\n");
}

function textToFaq(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, answer] = line.split("::").map((part) => part.trim());
      return { question: question ?? "", answer: answer ?? "" };
    });
}

function processStepsToText(
  steps?: Array<{ title?: string; subtitle?: string; items?: string[] }>
) {
  return (steps ?? [])
    .map((step) => {
      const items = (step.items ?? []).join(" | ");
      return `${step.title ?? ""} :: ${step.subtitle ?? ""} :: ${items}`.trim();
    })
    .join("\n");
}

function textToProcessSteps(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, subtitle, itemsText] = line.split("::").map((part) => part.trim());
      const items = itemsText
        ? itemsText.split("|").map((item) => item.trim()).filter(Boolean)
        : [];
      return { title: title ?? "", subtitle: subtitle ?? "", items };
    });
}

function autoResizeTextArea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}
