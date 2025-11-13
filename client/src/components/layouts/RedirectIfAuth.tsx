import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Ten komponent:
// 1. Czeka na zakończenie ładowania stanu autorykacji.
// 2. Jeśli user JEST zalogowany, przekierowuje na /dashboard.
// 3. Jeśli user NIE JEST zalogowany, wyświetla podrzędne trasy (Login, Register, Home).

export default function RedirectIfAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Zwracamy 'null' (lub komponent globalnego spinnera), aby nic się 
    // nie renderowało, zanim nie poznamy stanu użytkownika. 
    // Zapobiega to "mignięciu" strony logowania, gdy user jest już zalogowany.
    return null;
  }

  if (user) {
    // Użytkownik jest zalogowany, przekieruj na dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Użytkownik nie jest zalogowany, zezwól na dostęp do Outlet
  return <Outlet />;
}