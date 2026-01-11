import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export default function ConfirmDeletePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      await authApi.confirmDeleteAccount(token);
      
      toast({ 
        variant: "success",
        title: "Konto usunięte", 
        description: "Twoje konto zostało trwale usunięte. Przekierowywanie..." 
      });
      
      // Czekamy 2 sekundy, żeby użytkownik zobaczył komunikat sukcesu
      setTimeout(() => {
        window.location.replace("/"); 
      }, 2000);

    } catch {
      toast({ 
        variant: "destructive", 
        title: "Błąd", 
        description: "Link jest nieważny lub wygasł." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return <div className="min-h-screen flex items-center justify-center bg-background">Brak tokenu.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-destructive/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
            <Trash2 className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive flex items-center justify-center gap-2">
            Potwierdź usunięcie konta
          </CardTitle>
          <CardDescription>
            Czy na pewno chcesz trwale usunąć swoje konto? Tego działania nie można cofnąć.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="destructive" className="w-full" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tak, usuń konto trwale
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
            Anuluj
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}