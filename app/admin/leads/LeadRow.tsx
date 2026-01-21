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
  stage?: string | null;
  notes?: string | null;
  analysis_status?: string | null;
  analysis_summary?: string | null;
};

type LeadTask = {
  id: string;
  title: string;
  status: string;
  due_date?: string | null;
  assignee_id?: string | null;
};

type TeamMember = {
  id: string;
  name: string;
};

const statusOptions = [
  { value: "new", label: "Новый" },
  { value: "in_progress", label: "В работе" },
  { value: "won", label: "Сделка" },
  { value: "lost", label: "Отказ" }
];

export default function LeadRow({
  lead,
  tags: initialTags,
  tasks: initialTasks,
  stages,
  team
}: {
  lead: Lead;
  tags: string[];
  tasks: LeadTask[];
  stages: string[];
  team: TeamMember[];
}) {
  const [status, setStatus] = useState(lead.status ?? "new");
  const [stage, setStage] = useState(lead.stage ?? "new");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(lead.analysis_summary ?? "");
  const [analysisStatus, setAnalysisStatus] = useState(lead.analysis_status ?? "pending");
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tasks, setTasks] = useState<LeadTask[]>(initialTasks);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const saveLead = async (payload: { status?: string; notes?: string; stage?: string }) => {
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

  const onStageChange = async (value: string) => {
    setStage(value);
    await saveLead({ stage: value });
  };

  const onTagsBlur = async () => {
    const nextTags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setTags(nextTags);
    await fetch(`/api/admin/leads/${lead.id}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: nextTags })
    });
  };

  const onAddTask = async () => {
    if (!taskTitle.trim()) return;
    const response = await fetch(`/api/admin/leads/${lead.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskTitle,
        due_date: taskDue || undefined,
        assignee_id: taskAssignee || undefined
      })
    });
    const data = (await response.json().catch(() => ({}))) as { id?: string | null };
    const newId = typeof data.id === "string" ? data.id : null;

    if (response.ok && newId) {
      setTasks((prev) => [
        {
          id: newId,
          title: taskTitle,
          status: "open",
          due_date: taskDue || null,
          assignee_id: taskAssignee || null
        },
        ...prev
      ]);
      setTaskTitle("");
      setTaskDue("");
      setTaskAssignee("");
    }
  };

  const onToggleTask = async (task: LeadTask) => {
    const nextStatus = task.status === "done" ? "open" : "done";
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
    );
    await fetch(`/api/admin/leads/${lead.id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, status: nextStatus })
    });
  };

  const onDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== taskId));
    await fetch(`/api/admin/leads/${lead.id}/tasks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId })
    });
  };

  const getAssigneeName = (assigneeId?: string | null) =>
    team.find((member) => member.id === assigneeId)?.name ?? "";

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
          <select value={stage} onChange={(event) => onStageChange(event.target.value)}>
            {stages.map((stageName) => (
              <option key={stageName} value={stageName}>
                {stageName}
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

      <div style={{ marginBottom: 12 }}>
        <label>Теги (через запятую)</label>
        <input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          onBlur={onTagsBlur}
          placeholder="ai, crm, срочно"
        />
        {tags.length > 0 && (
          <div className="admin-tags">
            {tags.map((tag) => (
              <span key={tag} className="admin-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Задачи</label>
        <div className="admin-form">
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Новая задача"
          />
          <div className="admin-grid">
            <input
              type="date"
              value={taskDue}
              onChange={(event) => setTaskDue(event.target.value)}
            />
            <select value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}>
              <option value="">Исполнитель</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" type="button" onClick={onAddTask}>
            Добавить задачу
          </button>
        </div>
        {tasks.length > 0 && (
          <div>
            {tasks.map((task) => (
              <div key={task.id} className="admin-task">
                <div>
                  <strong>{task.title}</strong>
                  {task.due_date && <div className="section-subtitle">До {task.due_date}</div>}
                  {task.assignee_id && (
                    <div className="section-subtitle">
                      Исполнитель: {getAssigneeName(task.assignee_id)}
                    </div>
                  )}
                </div>
                <div className="admin-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => onToggleTask(task)}
                  >
                    {task.status === "done" ? "Вернуть" : "Готово"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
