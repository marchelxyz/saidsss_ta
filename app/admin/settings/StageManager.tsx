"use client";

import { useEffect, useState } from "react";

type Stage = {
  id: string;
  name: string;
  sort_order: number;
};

export default function StageManager() {
  const [items, setItems] = useState<Stage[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/stages");
    const data = (await response.json().catch(() => ({}))) as { items?: Stage[] };
    setItems(data.items ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onAdd = async () => {
    if (!name.trim()) return;
    await fetch("/api/admin/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setName("");
    await load();
  };

  const onUpdate = async (id: string, payload: Partial<Stage>) => {
    await fetch(`/api/admin/stages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/admin/stages/${id}`, {
      method: "DELETE" }
    );
    await load();
  };

  return (
    <div className="admin-card">
      <h3>Воронка продаж</h3>
      <div className="admin-form">
        <input
          placeholder="Новая стадия"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button className="btn btn-secondary" type="button" onClick={onAdd}>
          Добавить стадию
        </button>
      </div>
      {items.length === 0 ? (
        <p className="section-subtitle">Стадий пока нет.</p>
      ) : (
        <div className="admin-form">
          {items.map((stage) => (
            <div key={stage.id} className="admin-card">
              <div className="admin-grid">
                <input
                  value={stage.name}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === stage.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(stage.id, { name: stage.name })}
                />
                <input
                  type="number"
                  value={stage.sort_order}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === stage.id
                          ? { ...item, sort_order: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(stage.id, { sort_order: stage.sort_order })}
                />
                <button className="btn btn-secondary" type="button" onClick={() => onDelete(stage.id)}>
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
