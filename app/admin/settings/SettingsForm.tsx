"use client";

import { useState } from "react";

type Settings = {
  telegram: string;
  email: string;
  phone: string;
  address: string;
  company_name: string;
  legal_address: string;
  inn: string;
  ogrn: string;
  kpp: string;
  policy_url: string;
  vk_url: string;
  telegram_url: string;
  youtube_url: string;
  instagram_url: string;
};

export default function SettingsForm({ initial }: { initial: Partial<Settings> }) {
  const [form, setForm] = useState<Settings>({
    telegram: initial.telegram ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? "",
    company_name: initial.company_name ?? "",
    legal_address: initial.legal_address ?? "",
    inn: initial.inn ?? "",
    ogrn: initial.ogrn ?? "",
    kpp: initial.kpp ?? "",
    policy_url: initial.policy_url ?? "",
    vk_url: initial.vk_url ?? "",
    telegram_url: initial.telegram_url ?? "",
    youtube_url: initial.youtube_url ?? "",
    instagram_url: initial.instagram_url ?? ""
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
      <h3>Контакты</h3>
      <div>
        <label>Telegram</label>
        <input name="telegram" value={form.telegram} onChange={onChange} />
      </div>
      <div>
        <label>Telegram (ссылка)</label>
        <input name="telegram_url" value={form.telegram_url} onChange={onChange} />
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
      <h3>Реквизиты</h3>
      <div>
        <label>Название организации</label>
        <input name="company_name" value={form.company_name} onChange={onChange} />
      </div>
      <div>
        <label>Юридический адрес</label>
        <input name="legal_address" value={form.legal_address} onChange={onChange} />
      </div>
      <div>
        <label>ИНН</label>
        <input name="inn" value={form.inn} onChange={onChange} />
      </div>
      <div>
        <label>ОГРН</label>
        <input name="ogrn" value={form.ogrn} onChange={onChange} />
      </div>
      <div>
        <label>КПП</label>
        <input name="kpp" value={form.kpp} onChange={onChange} />
      </div>
      <h3>Политика</h3>
      <div>
        <label>Ссылка на политику персональных данных</label>
        <input name="policy_url" value={form.policy_url} onChange={onChange} />
      </div>
      <h3>Социальные сети</h3>
      <div>
        <label>VK</label>
        <input name="vk_url" value={form.vk_url} onChange={onChange} />
      </div>
      <div>
        <label>YouTube</label>
        <input name="youtube_url" value={form.youtube_url} onChange={onChange} />
      </div>
      <div>
        <label>Instagram</label>
        <input name="instagram_url" value={form.instagram_url} onChange={onChange} />
      </div>
      <button className="btn" type="button" onClick={onSave}>
        Сохранить
      </button>
      {status && <p className="section-subtitle">{status}</p>}
    </div>
  );
}
