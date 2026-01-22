"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/leads", label: "CRM" },
  { href: "/admin/pages", label: "Конструктор" },
  { href: "/admin/articles", label: "Статьи" },
  { href: "/admin/cases", label: "Кейсы" },
  { href: "/admin/team", label: "Команда" },
  { href: "/admin/audit", label: "История" },
  { href: "/admin/settings", label: "Настройки" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <strong>TeleAgent Admin</strong>
      {navItems.map((item) => (
        <Link
          key={item.href}
          className={pathname.startsWith(item.href) ? "active" : ""}
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
      <button
        className="btn btn-secondary"
        type="button"
        onClick={async () => {
          await fetch("/api/admin/login", { method: "DELETE" });
          window.location.href = "/admin/login";
        }}
      >
        Выйти
      </button>
    </aside>
  );
}
