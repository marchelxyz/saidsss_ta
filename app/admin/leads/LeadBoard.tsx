"use client";

import { useMemo, useState } from "react";
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
};

export default function LeadBoard({
  leads,
  tagsByLead,
  tasksByLead,
  stages,
  team
}: LeadBoardProps) {
  const [items, setItems] = useState<Lead[]>(leads);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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

  const updateLeadStage = (leadId: string, stage: string) => {
    setItems((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead))
    );
  };

  const saveLeadStage = async (leadId: string, stage: string) => {
    updateLeadStage(leadId, stage);
    await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage })
    });
  };

  const handleDrop = async (stageName: string) => {
    if (!dragLeadId) return;
    setDragOverStage(null);
    await saveLeadStage(dragLeadId, stageName);
    setDragLeadId(null);
  };

  return (
    <div className="admin-board">
      {stages.map((stageName) => (
        <div
          key={stageName}
          className={`admin-column${dragOverStage === stageName ? " is-drop-target" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={() => setDragOverStage(stageName)}
          onDragLeave={() => setDragOverStage((current) => (current === stageName ? null : current))}
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
              draggable
              onDragStart={() => setDragLeadId(lead.id)}
              onStageChange={(value) => updateLeadStage(lead.id, value)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
