import { getPool } from "@/lib/db";
import SettingsForm from "./SettingsForm";
import LossReasonManager from "./LossReasonManager";
import StageManager from "./StageManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const pool = getPool();
  const result = await pool.query(
    `select telegram, email, phone, address, company_name, legal_address, inn, ogrn, kpp,
            policy_url, vk_url, telegram_url, youtube_url, instagram_url
     from site_settings where id = 1`
  );

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Настройки</h1>
        <p className="section-subtitle">
          Контакты, реквизиты, политика и ссылки на соцсети для сайта.
        </p>
      </div>
      <SettingsForm initial={result.rows[0] ?? {}} />
      <StageManager />
      <LossReasonManager />
    </div>
  );
}
