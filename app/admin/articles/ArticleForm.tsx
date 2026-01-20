"use client";

import { useState } from "react";

type Article = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  published: boolean;
};

export default function ArticleForm({ initial }: { initial?: Partial<Article> }) {
  const [form, setForm] = useState<Article>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    cover_url: initial?.cover_url ?? "",
    published: initial?.published ?? false
  });

  const [aiInput, setAiInput] = useState({
    topic: "",
    audience: "",
    goal: "",
    tone: "деловой"
  });
  const [status, setStatus] = useState("");

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, published: event.target.checked }));
  };

  const onGenerate = async () => {
    setStatus("Генерируем...");
    try {
      const response = await fetch("/api/admin/ai/article-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiInput)
      });
      const data = (await response.json().catch(() => ({}))) as {
        draft?: { title?: string; excerpt?: string; content?: string };
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Не удалось сгенерировать");
      }

      setForm((prev) => ({
        ...prev,
        title: data.draft?.title ?? prev.title,
        excerpt: data.draft?.excerpt ?? prev.excerpt,
        content: data.draft?.content ?? prev.content
      }));
      setStatus("Черновик готов");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка AI");
    }
  };

  const onSave = async () => {
    setStatus("Сохраняем...");
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_url: form.cover_url,
      published: form.published
    };

    const response = await fetch(form.id ? `/api/admin/articles/${form.id}` : "/api/admin/articles", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!response.ok) {
      setStatus(data.message ?? "Ошибка сохранения");
      return;
    }

    if (!form.id && data.id) {
      window.location.href = `/admin/articles/${data.id}`;
      return;
    }

    setStatus("Сохранено");
  };

  return (
    <div className="admin-form">
      <div>
        <label>Заголовок</label>
        <input name="title" value={form.title} onChange={onChange} required />
      </div>
      <div>
        <label>Slug (URL)</label>
        <input name="slug" value={form.slug} onChange={onChange} />
      </div>
      <div>
        <label>Краткое описание</label>
        <textarea name="excerpt" value={form.excerpt} onChange={onChange} />
      </div>
      <div>
        <label>Обложка (URL)</label>
        <input name="cover_url" value={form.cover_url} onChange={onChange} />
      </div>
      <div>
        <label>Контент</label>
        <textarea name="content" value={form.content} onChange={onChange} />
      </div>
      <label>
        <input type="checkbox" checked={form.published} onChange={onToggle} /> Публиковать
      </label>

      <div className="admin-card">
        <h3>AI-помощник</h3>
        <div className="admin-form">
          <div>
            <label>Тема</label>
            <input
              value={aiInput.topic}
              onChange={(event) => setAiInput({ ...aiInput, topic: event.target.value })}
            />
          </div>
          <div>
            <label>Аудитория</label>
            <input
              value={aiInput.audience}
              onChange={(event) => setAiInput({ ...aiInput, audience: event.target.value })}
            />
          </div>
          <div>
            <label>Цель статьи</label>
            <input
              value={aiInput.goal}
              onChange={(event) => setAiInput({ ...aiInput, goal: event.target.value })}
            />
          </div>
          <div>
            <label>Тон</label>
            <input
              value={aiInput.tone}
              onChange={(event) => setAiInput({ ...aiInput, tone: event.target.value })}
            />
          </div>
          <button className="btn btn-secondary" type="button" onClick={onGenerate}>
            Сгенерировать черновик
          </button>
        </div>
      </div>

      <button className="btn" type="button" onClick={onSave}>
        Сохранить
      </button>
      {status && <p className="section-subtitle">{status}</p>}
    </div>
  );
}
