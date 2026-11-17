import { Outlet } from "react-router-dom";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminLayout() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-8">
      <AdminNav />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
