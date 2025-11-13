import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // sprawdzania sesji
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Ładowanie sesji...</p>
      </div>
    );
  }

  // Jeśli nie ma użytkownika, przekieruj na logowanie
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jeśli użytkownik jest, wyświetl podrzędne komponenty (np. Dashboard)
  return <Outlet />;
}