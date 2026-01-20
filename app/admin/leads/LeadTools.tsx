"use client";

import { useState } from "react";

export default function LeadTools() {
  const [status, setStatus] = useState("");
  const [csv, setCsv] = useState("");

  const onImport = async () => {
    if (!csv.trim()) {
      setStatus("Вставьте CSV");
      return;
    }
    setStatus("Импортируем...");
    const response = await fetch("/api/admin/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv })
    });
    const data = (await response.json().catch(() => ({}))) as { inserted?: number; message?: string };
    if (!response.ok) {
      setStatus(data.message ?? "Ошибка импорта");
      return;
    }
    setCsv("");
    setStatus(`Импортировано: ${data.inserted ?? 0}`);
    window.location.reload();
  };

  return (
    <div className="admin-card">
      <div className="admin-actions">
        <a className="btn btn-secondary" href="/api/admin/leads/export">
          Экспорт CSV
        </a>
      </div>
      <div className="admin-form" style={{ marginTop: 12 }}>
        <label>Импорт CSV (заголовки: name, phone, email, company, role, summary, message, budget, timeline, status, stage)</label>
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} />
        <button className="btn btn-secondary" type="button" onClick={onImport}>
          Импортировать
        </button>
        {status && <p className="section-subtitle">{status}</p>}
      </div>
    </div>
  );
}
