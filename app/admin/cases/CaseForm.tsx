"use client";

import { useState } from "react";

type CaseItem = {
  id?: string;
  title: string;
  slug: string;
  company_name: string;
  provider_name: string;
  source_url: string;
  country: string;
  industry: string;
  challenge: string;
  solution: string;
  result: string;
  metrics: string;
  cover_url: string;
  published: boolean;
};

export default function CaseForm({ initial }: { initial?: Partial<CaseItem> }) {
  const [form, setForm] = useState<CaseItem>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    company_name: (initial as CaseItem | undefined)?.company_name ?? "",
    provider_name: (initial as CaseItem | undefined)?.provider_name ?? "",
    source_url: (initial as CaseItem | undefined)?.source_url ?? "",
    country: (initial as CaseItem | undefined)?.country ?? "",
    industry: initial?.industry ?? "",
    challenge: initial?.challenge ?? "",
    solution: initial?.solution ?? "",
    result: initial?.result ?? "",
    metrics: initial?.metrics ?? "",
    cover_url: initial?.cover_url ?? "",
    published: initial?.published ?? false
  });
  const [status, setStatus] = useState("");

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, published: event.target.checked }));
  };

  const onSave = async () => {
    setStatus("Сохраняем...");
    const payload = {
      title: form.title,
      slug: form.slug,
      company_name: form.company_name,
      provider_name: form.provider_name,
      source_url: form.source_url,
      country: form.country,
      industry: form.industry,
      challenge: form.challenge,
      solution: form.solution,
      result: form.result,
      metrics: form.metrics,
      cover_url: form.cover_url,
      published: form.published
    };

    const response = await fetch(form.id ? `/api/admin/cases/${form.id}` : "/api/admin/cases", {
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
      window.location.href = `/admin/cases/${data.id}`;
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
        <label>Отрасль</label>
        <input name="industry" value={form.industry} onChange={onChange} />
      </div>
      <div>
        <label>Компания (реальный заказчик)</label>
        <input name="company_name" value={form.company_name} onChange={onChange} />
      </div>
      <div>
        <label>Вендор/партнер внедрения</label>
        <input name="provider_name" value={form.provider_name} onChange={onChange} />
      </div>
      <div>
        <label>Страна</label>
        <input name="country" value={form.country} onChange={onChange} />
      </div>
      <div>
        <label>Источник (URL)</label>
        <input name="source_url" value={form.source_url} onChange={onChange} />
      </div>
      <div>
        <label>Проблема</label>
        <textarea name="challenge" value={form.challenge} onChange={onChange} />
      </div>
      <div>
        <label>Решение</label>
        <textarea name="solution" value={form.solution} onChange={onChange} />
      </div>
      <div>
        <label>Результат</label>
        <textarea name="result" value={form.result} onChange={onChange} />
      </div>
      <div>
        <label>Метрики</label>
        <textarea name="metrics" value={form.metrics} onChange={onChange} />
      </div>
      <div>
        <label>Обложка (URL)</label>
        <input name="cover_url" value={form.cover_url} onChange={onChange} />
      </div>
      <label>
        <input type="checkbox" checked={form.published} onChange={onToggle} /> Публиковать
      </label>
      <button className="btn" type="button" onClick={onSave}>
        Сохранить
      </button>
      {status && <p className="section-subtitle">{status}</p>}
    </div>
  );
}
