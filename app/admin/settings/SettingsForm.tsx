"use client";

import { useState } from "react";

type Settings = {
  telegram: string;
  email: string;
  phone: string;
  address: string;
};

export default function SettingsForm({ initial }: { initial: Partial<Settings> }) {
  const [form, setForm] = useState<Settings>({
    telegram: initial.telegram ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? ""
  });
  const [status, setStatus] = useState("");

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async () => {
    setStatus("Сохраняем...");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setStatus(data.message ?? "Ошибка сохранения");
      return;
    }

    setStatus("Сохранено");
  };

  return (
    <div className="admin-form">
      <div>
        <label>Telegram</label>
        <input name="telegram" value={form.telegram} onChange={onChange} />
      </div>
      <div>
        <label>Email</label>
        <input name="email" value={form.email} onChange={onChange} />
      </div>
      <div>
        <label>Телефон</label>
        <input name="phone" value={form.phone} onChange={onChange} />
      </div>
      <div>
        <label>Адрес</label>
        <input name="address" value={form.address} onChange={onChange} />
      </div>
      <button className="btn" type="button" onClick={onSave}>
        Сохранить
      </button>
      {status && <p className="section-subtitle">{status}</p>}
    </div>
  );
}
