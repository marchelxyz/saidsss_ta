"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LeadRow from "./LeadRow";

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
  is_lost?: boolean | null;
  loss_reason_id?: string | null;
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

type LeadBoardProps = {
  leads: Lead[];
  tagsByLead: Record<string, string[]>;
  tasksByLead: Record<string, LeadTask[]>;
  stages: string[];
  team: TeamMember[];
  lossReasons: Array<{ id: string; name: string }>;
};

export default function LeadBoard({
  leads,
  tagsByLead,
  tasksByLead,
  stages,
  team,
  lossReasons
}: LeadBoardProps) {
  const [items, setItems] = useState<Lead[]>(leads);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const scrollTimerRef = useRef<number | null>(null);

  const leadsByStage = useMemo(() => {
    const map = new Map<string, Lead[]>();
    stages.forEach((stage) => map.set(stage, []));
    items.forEach((lead) => {
      const bucket = lead.stage ?? "new";
      const list = map.get(bucket) ?? [];
      list.push(lead);
      map.set(bucket, list);
    });
    return map;
  }, [items, stages]);

  function updateLeadStage(leadId: string, stage: string) {
    setItems((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead))
    );
  }

  async function saveLeadStage(leadId: string, stage: string) {
    updateLeadStage(leadId, stage);
    await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage })
    });
  }

  async function handleDrop(stageName: string) {
    if (!dragLeadId) return;
    setDragOverStage(null);
    await saveLeadStage(dragLeadId, stageName);
    setDragLeadId(null);
  }

  function startScroll(direction: number) {
    stopScroll();
    scrollTimerRef.current = window.setInterval(() => {
      boardRef.current?.scrollBy({ left: direction * 18, behavior: "auto" });
    }, 16);
  }

  function stopScroll() {
    if (scrollTimerRef.current === null) return;
    window.clearInterval(scrollTimerRef.current);
    scrollTimerRef.current = null;
  }

  useEffect(() => {
    return () => stopScroll();
  }, []);

  return (
    <div className="admin-board-shell">
      <button
        className="board-scroll-button left"
        type="button"
        onMouseEnter={() => startScroll(-1)}
        onMouseLeave={stopScroll}
        onFocus={() => startScroll(-1)}
        onBlur={stopScroll}
      >
        ‹
      </button>
      <div className="admin-board" ref={boardRef}>
        {stages.map((stageName) => (
          <div
            key={stageName}
            className={`admin-column${dragOverStage === stageName ? " is-drop-target" : ""}`}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setDragOverStage(stageName)}
            onDragLeave={() =>
              setDragOverStage((current) => (current === stageName ? null : current))
            }
            onDrop={() => handleDrop(stageName)}
          >
            <h3>{stageName}</h3>
            {(leadsByStage.get(stageName) ?? []).map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                tags={tagsByLead[lead.id] ?? []}
                tasks={tasksByLead[lead.id] ?? []}
                stages={stages}
                team={team}
                lossReasons={lossReasons}
                draggable
                onDragStart={() => setDragLeadId(lead.id)}
                onStageChange={(value) => updateLeadStage(lead.id, value)}
                onLeadUpdate={(patch) =>
                  setItems((prev) =>
                    prev.map((item) => (item.id === lead.id ? { ...item, ...patch } : item))
                  )
                }
              />
            ))}
          </div>
        ))}
      </div>
      <button
        className="board-scroll-button right"
        type="button"
        onMouseEnter={() => startScroll(1)}
        onMouseLeave={stopScroll}
        onFocus={() => startScroll(1)}
        onBlur={stopScroll}
      >
        ›
      </button>
    </div>
  );
}
