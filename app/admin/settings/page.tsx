import { getPool } from "@/lib/db";
import SettingsForm from "./SettingsForm";
import StageManager from "./StageManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const pool = getPool();
  const result = await pool.query(
    `select telegram, email, phone, address from site_settings where id = 1`
  );

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Настройки</h1>
        <p className="section-subtitle">Контакты и данные для сайта</p>
      </div>
      <SettingsForm initial={result.rows[0] ?? {}} />
      <StageManager />
    </div>
  );
}
