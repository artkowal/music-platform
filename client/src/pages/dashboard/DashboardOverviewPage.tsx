import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Witaj z powrotem, {user?.first_name || 'Użytkowniku'}!</CardTitle>
      </CardHeader>
      <CardContent>
        <p>To jest Twój główny pulpit. Stąd możesz zarządzać swoimi kursami i lekcjami.</p>
      </CardContent>
    </Card>
  );
}