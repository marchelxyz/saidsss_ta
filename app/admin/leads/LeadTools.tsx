"use client";

import { useMemo, useState } from "react";

type LossReason = {
  id: string;
  name: string;
};

export default function LeadTools({
  stages,
  lossReasons
}: {
  stages: string[];
  lossReasons: LossReason[];
}) {
  const [status, setStatus] = useState("");
  const [csv, setCsv] = useState("");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedLossReasons, setSelectedLossReasons] = useState<string[]>([]);
  const [inWorkOnly, setInWorkOnly] = useState(false);
  const [lostOnly, setLostOnly] = useState(false);

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

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedStages.length) {
      params.set("stages", selectedStages.join(","));
    }
    if (selectedLossReasons.length) {
      params.set("loss_reasons", selectedLossReasons.join(","));
    }
    if (inWorkOnly) {
      params.set("in_work", "true");
    }
    if (lostOnly) {
      params.set("lost", "true");
    }
    const query = params.toString();
    return query ? `/api/admin/leads/export?${query}` : "/api/admin/leads/export";
  }, [selectedStages, selectedLossReasons, inWorkOnly, lostOnly]);

  return (
    <div className="admin-card">
      <div className="admin-actions">
        <a className="btn btn-secondary" href={exportUrl}>
          Экспорт CSV
        </a>
      </div>
      <div className="admin-form" style={{ marginTop: 12 }}>
        <label>Экспорт: стадии</label>
        <select
          multiple
          value={selectedStages}
          onChange={(event) =>
            setSelectedStages(Array.from(event.target.selectedOptions).map((item) => item.value))
          }
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <label>Экспорт: причины слива</label>
        <select
          multiple
          value={selectedLossReasons}
          onChange={(event) =>
            setSelectedLossReasons(
              Array.from(event.target.selectedOptions).map((item) => item.value)
            )
          }
        >
          {lossReasons.map((reason) => (
            <option key={reason.id} value={reason.id}>
              {reason.name}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={inWorkOnly}
            onChange={(event) => {
              setInWorkOnly(event.target.checked);
              if (event.target.checked) setLostOnly(false);
            }}
          />
          Только в работе
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={lostOnly}
            onChange={(event) => {
              setLostOnly(event.target.checked);
              if (event.target.checked) setInWorkOnly(false);
            }}
          />
          Только слив
        </label>
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
