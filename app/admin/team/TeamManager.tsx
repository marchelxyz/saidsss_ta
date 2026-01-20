"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean | null;
};

export default function TeamManager() {
  const [items, setItems] = useState<Member[]>([]);
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "" });
  const [status, setStatus] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/team");
    const data = (await response.json().catch(() => ({}))) as { items?: Member[] };
    setItems(data.items ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async () => {
    setStatus("Добавляем...");
    const response = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        role: form.role,
        email: form.email,
        phone: form.phone
      })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setStatus(data.message ?? "Ошибка");
      return;
    }

    setForm({ name: "", role: "", email: "", phone: "" });
    setStatus("Добавлено");
    await load();
  };

  const onUpdate = async (id: string, payload: Partial<Member>) => {
    await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/admin/team/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    await load();
  };

  return (
    <div className="admin-form">
      <div className="admin-card">
        <h3>Добавить участника</h3>
        <div className="admin-form">
          <input
            name="name"
            placeholder="Имя"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            name="role"
            placeholder="Роль"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          />
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <input
            name="phone"
            placeholder="Телефон"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <button className="btn" type="button" onClick={onCreate}>
            Добавить
          </button>
          {status && <p className="section-subtitle">{status}</p>}
        </div>
      </div>

      <div className="admin-card">
        <h3>Команда</h3>
        {items.length === 0 ? (
          <p className="section-subtitle">Пока нет участников.</p>
        ) : (
          items.map((member) => (
            <div key={member.id} className="admin-card" style={{ marginBottom: 12 }}>
              <div className="admin-grid">
                <input
                  value={member.name}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === member.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(member.id, { name: member.name })}
                />
                <input
                  value={member.role ?? ""}
                  placeholder="Роль"
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === member.id ? { ...item, role: event.target.value } : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(member.id, { role: member.role ?? "" })}
                />
                <input
                  value={member.email ?? ""}
                  placeholder="Email"
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === member.id ? { ...item, email: event.target.value } : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(member.id, { email: member.email ?? "" })}
                />
                <input
                  value={member.phone ?? ""}
                  placeholder="Телефон"
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item) =>
                        item.id === member.id ? { ...item, phone: event.target.value } : item
                      )
                    )
                  }
                  onBlur={() => onUpdate(member.id, { phone: member.phone ?? "" })}
                />
              </div>
              <div className="admin-actions" style={{ marginTop: 8 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={member.active ?? true}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setItems((prev) =>
                        prev.map((item) =>
                          item.id === member.id ? { ...item, active: checked } : item
                        )
                      );
                      void onUpdate(member.id, { active: checked });
                    }}
                  />
                  Активен
                </label>
                <button className="btn btn-secondary" type="button" onClick={() => onDelete(member.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
