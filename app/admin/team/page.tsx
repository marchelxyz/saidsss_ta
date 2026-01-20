import TeamManager from "./TeamManager";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="section-title">Команда</h1>
        <p className="section-subtitle">Роли и контакты сотрудников</p>
      </div>
      <TeamManager />
    </div>
  );
}
