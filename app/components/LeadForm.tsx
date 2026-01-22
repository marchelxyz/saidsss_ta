"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Status = "idle" | "sending" | "success" | "error";

type FormState = {
  name: string;
  phone: string;
  email: string;
  company: string;
  role: string;
  budget: string;
  timeline: string;
  summary: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  company: "",
  role: "",
  budget: "",
  timeline: "",
  summary: "",
  message: ""
};

type LeadFormProps = {
  sourcePage?: string;
};

export default function LeadForm({ sourcePage }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const onChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const tryAdminLogin = async (password: string) => {
    if (!password.trim()) return;
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        window.location.href = "/admin";
      }
    } catch {
      // intentionally ignore
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sourcePage: sourcePage ?? ""
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        adminLogin?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Не удалось отправить заявку.");
      }

      if (data.adminLogin) {
        window.location.href = "/admin";
        return;
      }

      setStatus("success");
      setForm(initialState);
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось отправить заявку."
      );
    }
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-row">
        <input
          className="input"
          name="name"
          placeholder="Ваше имя"
          value={form.name}
          onChange={onChange}
          onBlur={() => tryAdminLogin(form.name)}
          required
        />
        <input
          className="input"
          name="phone"
          placeholder="Телефон"
          value={form.phone}
          onChange={onChange}
          required
          type="tel"
        />
      </div>
      <div className="form-row">
        <input
          className="input"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          type="email"
        />
        <input
          className="input"
          name="company"
          placeholder="Компания"
          value={form.company}
          onChange={onChange}
        />
      </div>
      <div className="form-row">
        <input
          className="input"
          name="role"
          placeholder="Роль / должность"
          value={form.role}
          onChange={onChange}
        />
        <select className="input" name="budget" value={form.budget} onChange={onChange}>
          <option value="">Бюджет проекта</option>
          <option value="до 300 тыс">До 300 тыс</option>
          <option value="300-700 тыс">300–700 тыс</option>
          <option value="700 тыс - 1.5 млн">700 тыс – 1.5 млн</option>
          <option value="1.5-3 млн">1.5–3 млн</option>
          <option value="не определен">Пока не определен</option>
        </select>
      </div>
      <div className="form-row">
        <select
          className="input"
          name="timeline"
          value={form.timeline}
          onChange={onChange}
        >
          <option value="">Сроки запуска</option>
          <option value="до 1 месяца">До 1 месяца</option>
          <option value="1-2 месяца">1–2 месяца</option>
          <option value="3-4 месяца">3–4 месяца</option>
          <option value="5+ месяцев">5+ месяцев</option>
          <option value="не определены">Пока не определены</option>
        </select>
        <input
          className="input"
          name="summary"
          placeholder="Кратко опишите задачу"
          value={form.summary}
          onChange={onChange}
        />
      </div>
      <textarea
        className="textarea"
        name="message"
        placeholder="Дополнительные детали, цели, процессы для автоматизации"
        value={form.message}
        onChange={onChange}
      />
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Отправляем..." : "Отправить заявку"}
      </button>
      {status === "success" && (
        <p className="success">Спасибо! Мы свяжемся с вами в течение 24 часов.</p>
      )}
      {status === "error" && <p className="error">{error}</p>}
      <p className="form-note">
        Нажимая на кнопку, вы соглашаетесь с политикой обработки персональных
        данных.
      </p>
    </form>
  );
}
