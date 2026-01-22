"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  niche: string | null;
  meta_description: string | null;
  published: boolean;
  leads_count: number;
};

type PageManagerProps = {
  initialPages: PageRow[];
};

export default function PageManager({ initialPages }: PageManagerProps) {
  const [pages, setPages] = useState<PageRow[]>(initialPages);
  const [niche, setNiche] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const homePage = useMemo(() => pages.find((item) => item.page_type === "home"), [pages]);

  const publicLink = (page: PageRow) => {
    if (page.page_type === "home") return "/";
    if (page.page_type === "industry") return `/industry/${page.slug}`;
    return `/p/${page.slug}`;
  };

  const refresh = async () => {
    const response = await fetch("/api/admin/pages");
    if (response.ok) {
      const data = (await response.json()) as { pages: PageRow[] };
      setPages(data.pages);
    }
  };

  const createHome = async () => {
    setIsBusy(true);
    try {
      await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageType: "home", title: "Главная", slug: "home" })
      });
      await refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const createIndustry = async () => {
    if (!niche.trim()) return;
    setIsBusy(true);
    try {
      await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageType: "industry",
          niche,
          generate: true
        })
      });
      setNiche("");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const createCustom = async () => {
    if (!customTitle.trim()) return;
    setIsBusy(true);
    try {
      await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageType: "custom",
          title: customTitle,
          slug: customSlug
        })
      });
      setCustomTitle("");
      setCustomSlug("");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm("Удалить страницу?")) return;
    setIsBusy(true);
    try {
      await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
      await refresh();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Конструктор страниц</h1>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Главная страница</h3>
          <p className="admin-hint">
            Управляйте блоками главной страницы через конструктор.
          </p>
          {homePage ? (
            <div className="admin-actions">
              <Link className="btn" href={`/admin/pages/${homePage.id}`}>
                Редактировать
              </Link>
              <a className="btn btn-secondary" href="/" target="_blank" rel="noreferrer">
                Открыть
              </a>
            </div>
          ) : (
            <button className="btn" type="button" onClick={createHome} disabled={isBusy}>
              Создать главную
            </button>
          )}
        </div>

        <div className="admin-card">
          <h3>Нишевые страницы</h3>
          <p className="admin-hint">
            Введите нишу — страница сгенерируется автоматически.
          </p>
          <div className="admin-form">
            <input
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              placeholder="Например: Стоматология"
            />
            <button className="btn" type="button" onClick={createIndustry} disabled={isBusy}>
              Сгенерировать
            </button>
          </div>
        </div>

        <div className="admin-card">
          <h3>Дополнительная страница</h3>
          <p className="admin-hint">Создайте страницу и наполните блоками.</p>
          <div className="admin-form">
            <input
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder="Название страницы"
            />
            <input
              value={customSlug}
              onChange={(event) => setCustomSlug(event.target.value)}
              placeholder="Slug (необязательно)"
            />
            <button className="btn" type="button" onClick={createCustom} disabled={isBusy}>
              Создать
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Ссылка</th>
              <th>Лиды</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>
                  <strong>{page.title}</strong>
                  {page.niche && <div className="admin-hint">Ниша: {page.niche}</div>}
                </td>
                <td>{page.page_type}</td>
                <td>
                  <a href={publicLink(page)} target="_blank" rel="noreferrer">
                    {publicLink(page)}
                  </a>
                </td>
                <td>{page.leads_count ?? 0}</td>
                <td>{page.published ? "Опубликовано" : "Черновик"}</td>
                <td>
                  <div className="admin-actions">
                    <Link href={`/admin/pages/${page.id}`}>Редактировать</Link>
                    <Link href={`/admin/pages/${page.id}/builder`}>Визуально</Link>
                    {page.page_type !== "home" && (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => deletePage(page.id)}
                        disabled={isBusy}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={6}>Страниц пока нет.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
