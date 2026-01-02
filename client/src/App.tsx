import { Routes, Route } from "react-router-dom";
import { GlobalToastHandler } from "./components/GlobalToastHandler";
import { Toaster } from "./components/ui/toaster";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

import HomePage from "@/pages/homePage/HomePage";
import LoginPage from "@/pages/loginPage/LoginPage";
import RegisterPage from "@/pages/RegisterPage/RegisterPage";

import ProtectedRoute from "@/components/layouts/ProtectedRoute";
import RedirectIfAuth from "@/components/layouts/RedirectIfAuth";
import MainLayout from "@/components/layouts/MainLayout";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardOverviewPage from "@/pages/dashboard/dashboardOverviewPage/DashboardOverviewPage";
import DashboardSettingsPage from "@/pages/dashboard/dashboardSettingsPage/DashboardSettingsPage";
import DashboardAboutPage from "@/pages/dashboard/DashboardAboutPage";

import DashboardWorkplacesSettingsPage from "./pages/dashboard/dashboardWorkplacesSettingsPage/DashboardWorkplacesSettingsPage";
import DashboardWorkplacePage from "./pages/dashboard/dashboardWorkplacePage/DashboardWorkplacePage";
import DashboardAllCoursesPage from "@/pages/dashboard/dashboardAllCoursesPage/DashboardAllCoursesPage";
import DashboardCourseSettingsPage from "./pages/dashboard/dashboardCourseSettingsPage/DashboardCourseSettingsPage";
import DashboardCoursePage from "./pages/dashboard/dashboardCoursePage/DashboardCoursePage";
import DashboardLessonPage from "./pages/dashboard/dashboardLessonPage/dashboardLessonPage";
import DashboardCalendarPage from "./pages/dashboard/dashboardCalendarPage/DashboardCalendarPage";
import DashboardFinancesPage from "./pages/dashboard/dashboardFinancesPage/dashboardFinancesPage";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ConfirmDeletePage from "./pages/ConfirmDeletePage";

function App() {
  return (
    <>
      <GlobalToastHandler />
      <Toaster />
      
      <SocketProvider>
         <NotificationProvider>
            <Routes>
              
              {/* 1. Trasy Całkowicie Publiczne (Dostępne zawsze) */}
              <Route path="/confirm-delete" element={<ConfirmDeletePage />} />

              {/* 2. Niezalogowani uzytkownicy (Jeśli zalogowany -> przekieruj na Dashboard) */}
              <Route element={<RedirectIfAuth />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                </Route>

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* 3. Zalogowani uzytkownicy (Chronione) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardOverviewPage />} />
                  <Route path="workplace/:id" element={<DashboardWorkplacePage />} />
                  <Route path="workplaces" element={<DashboardWorkplacesSettingsPage />} />
                  <Route path="courses" element={<DashboardAllCoursesPage />} />
                  <Route path="courses/:id" element={<DashboardCoursePage />} />
                  <Route path="courses/:id/settings" element={<DashboardCourseSettingsPage />} />
                  <Route path="courses/:courseId/lessons/:lessonId" element={<DashboardLessonPage />} />
                  <Route path="calendar" element={<DashboardCalendarPage />} />
                  <Route path="settings" element={<DashboardSettingsPage />} />
                  <Route path="about" element={<DashboardAboutPage />} />
                  <Route path="finances" element={<DashboardFinancesPage />} />
                </Route>
              </Route>
            </Routes>
         </NotificationProvider>
      </SocketProvider>
    </>
  );
}

export default App;