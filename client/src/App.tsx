import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

import ProtectedRoute from "@/components/layouts/ProtectedRoute";
import RedirectIfAuth from "@/components/layouts/RedirectIfAuth";
import MainLayout from "@/components/layouts/MainLayout";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardOverviewPage from "@/pages/dashboard/DashboardOverviewPage";
import DashboardSettingsPage from "@/pages/dashboard/DashboardSettingsPage";
import DashboardAboutPage from "@/pages/dashboard/DashboardAboutPage";

function App() {
  return (
    <Routes>
      {/* Niezalogowani uzytkownicy*/}
      <Route element={<RedirectIfAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Trasy publiczne BEZ Navbara */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Zalogowani uzytkownicy */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="settings" element={<DashboardSettingsPage />} />
          <Route path="about" element={<DashboardAboutPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;