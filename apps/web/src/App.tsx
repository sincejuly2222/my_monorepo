import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { NotFoundPage } from "./pages/not-found/NotFoundPage";
import { RoleManagementPage } from "./pages/role-management";
import { UserManagementPage } from "./pages/user-management";

/**
 * Web 应用根组件。
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="roles" element={<RoleManagementPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
