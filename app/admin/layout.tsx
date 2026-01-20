import "../globals.css";
import "./admin.css";
import Sidebar from "./components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">{children}</div>
    </div>
  );
}
