"use client";

import { useEffect, useState } from "react";

type LossReason = {
  id: string;
  name: string;
  sort_order: number;
};

export default function LossReasonManager() {
  const [items, setItems] = useState<LossReason[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/loss-reasons");
    const data = (await response.json().catch(() => ({}))) as { items?: LossReason[] };
    setItems(data.items ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onAdd = async () => {
    if (!name.trim()) return;
    await fetch("/api/admin/loss-reasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setName("");
    await load();
  };

  const onUpdate = async (id: string, payload: Partial<LossReason>) => {
    await fetch(`/api/admin/loss-reasons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/admin/loss-reasons/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="admin-card">
      <h3>Причины слива</h3>
      <div className="admin-form">
        <input
          placeholder="Новая причина"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button className="btn btn-secondary" type="button" onClick={onAdd}>
          Добавить причину
        </button>
      </div>
      {items.length === 0 ? (
        <p className="section-subtitle">Причин пока нет.</p>
      ) : (
        <div className="admin-form">
          {items.map((reason) => (
            <div key={reason.id} className="admin-card">
              <div className="admin-grid">
                <input
                  value={reason.name}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === reason.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(reason.id, { name: reason.name })}
                />
                <input
                  type="number"
                  value={reason.sort_order}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === reason.id
                          ? { ...item, sort_order: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(reason.id, { sort_order: reason.sort_order })}
                />
                <button className="btn btn-secondary" type="button" onClick={() => onDelete(reason.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
