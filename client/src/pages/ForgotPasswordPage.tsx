import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/api/auth";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string }>();
  const { toast } = useToast();

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSent(true);
      
      toast({ 
        variant: "success",
        title: "Wysłano", 
        description: "Link do resetu hasła został wysłany na email." 
      });

    } catch {
      toast({ 
        variant: "destructive",
        title: "Błąd", 
        description: "Nie udało się wysłać emaila." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader>
          <CardTitle>Zresetuj hasło</CardTitle>
          <CardDescription>Podaj swój email, aby otrzymać link do zmiany hasła.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="text-center space-y-4 animate-in slide-in-from-bottom-2">
              <p className="text-sm text-muted-foreground">Sprawdź swoją skrzynkę pocztową. Wysłaliśmy instrukcję resetowania hasła.</p>
              <Button asChild className="w-full" variant="outline">
                <Link to="/login" replace >Wróć do logowania</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Input {...register("email", { required: true })} type="email" placeholder="twoj@email.com" disabled={isLoading} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Wyślij link
              </Button>
              <Button asChild variant="link" className="w-full">
                <Link to="/login" replace className="flex items-center gap-2">
                   <ArrowLeft className="h-4 w-4" /> Powrót
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}