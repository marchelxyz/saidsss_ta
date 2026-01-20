"use client";

import { useState } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  role?: string | null;
  summary?: string | null;
  message?: string | null;
  status?: string | null;
  notes?: string | null;
  analysis_status?: string | null;
  analysis_summary?: string | null;
};

const statusOptions = [
  { value: "new", label: "Новый" },
  { value: "in_progress", label: "В работе" },
  { value: "won", label: "Сделка" },
  { value: "lost", label: "Отказ" }
];

export default function LeadRow({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status ?? "new");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(lead.analysis_summary ?? "");
  const [analysisStatus, setAnalysisStatus] = useState(lead.analysis_status ?? "pending");

  const saveLead = async (payload: { status?: string; notes?: string }) => {
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  const onStatusChange = async (value: string) => {
    setStatus(value);
    await saveLead({ status: value });
  };

  const onNotesBlur = async () => {
    await saveLead({ notes });
  };

  const onAnalyze = async () => {
    setLoading(true);
    setAnalysisStatus("running");
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/analyze`, {
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as {
        analysis?: { summary?: string };
      };
      if (response.ok) {
        setAnalysis(data.analysis?.summary ?? "");
        setAnalysisStatus("done");
      } else {
        setAnalysisStatus("failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div className="admin-toolbar">
        <div>
          <strong>{lead.name}</strong>
          <p className="section-subtitle" style={{ marginBottom: 6 }}>
            {lead.company || "Компания не указана"}
          </p>
          <p>{lead.phone}</p>
          {lead.email && <p>{lead.email}</p>}
        </div>
        <div className="admin-actions">
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={onAnalyze} disabled={loading}>
            {loading ? "Анализируем..." : "AI-анализ"}
          </button>
        </div>
      </div>

      {(lead.summary || lead.message) && (
        <div style={{ marginBottom: 12 }}>
          {lead.summary && <p><strong>Запрос:</strong> {lead.summary}</p>}
          {lead.message && <p><strong>Детали:</strong> {lead.message}</p>}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <span className="admin-pill">AI: {analysisStatus}</span>
        {analysis && <p style={{ marginTop: 8 }}>{analysis}</p>}
      </div>

      <div>
        <label>Заметки менеджера</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={onNotesBlur}
          placeholder="Комментарий по лиду, следующие шаги"
        />
      </div>
    </div>
  );
}
