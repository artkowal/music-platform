import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";

import ProtectedRoute from "@/components/layouts/ProtectedRoute";
import RedirectIfAuth from "@/components/layouts/RedirectIfAuth";
import MainLayout from "@/components/layouts/MainLayout";

function App() {
  return (
    <Routes>
      {/* === 1. Trasy dla NIEZALOGOWANYCH UŻYTKOWNIKÓW === */}
      {/* Jeśli user jest zalogowany, przekierują na /dashboard */}
      <Route element={<RedirectIfAuth />}>
        
        {/* Trasy publiczne Z Navbarem */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Trasy publiczne BEZ Navbara (logowanie, rejestracja) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* === 2. Trasy dla ZALOGOWANYCH UŻYTKOWNIKÓW === */}
      {/* Wymagają logowania (ProtectedRoute) i MAJĄ Navbar (MainLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      {/* TODO: NotFoundPage */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;