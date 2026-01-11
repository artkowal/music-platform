import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/api/auth";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

// Regex 
const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>();
  const [isLoading, setIsLoading] = useState(false);

  const passwordValue = watch("password");

  const passwordRequirements = useMemo(() => {
    const pwd = passwordValue || "";
    return [
        { label: "Min. 8 znaków", met: pwd.length >= 8 },
        { label: "1 duża litera", met: /[A-Z]/.test(pwd) },
        { label: "1 mała litera", met: /[a-z]/.test(pwd) },
        { label: "1 cyfra", met: /[0-9]/.test(pwd) },
        { label: "1 znak specjalny", met: /[^A-Za-z0-9]/.test(pwd) },
    ];
  }, [passwordValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    
    if (data.password !== data.confirmPassword) {
      toast({ 
        variant: "destructive", 
        title: "Błąd", 
        description: "Hasła nie są identyczne." 
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      
      toast({ 
        variant: "success", 
        title: "Hasło zmienione", 
        description: "Możesz się teraz zalogować nowym hasłem." 
      });
      
      navigate("/login", { replace: true });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      
      toast({ 
        variant: "destructive", 
        title: "Błąd", 
        description: err.response?.data?.message || "Link jest nieważny lub wygasł." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return <div className="min-h-screen flex items-center justify-center bg-background">Brak tokenu w linku.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader>
          <CardTitle>Nowe hasło</CardTitle>
          <CardDescription>Wprowadź nowe hasło dla swojego konta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
              <Input 
                {...register("password", { 
                  required: "Hasło jest wymagane", 
                  pattern: {
                    value: passwordRegex,
                    message: "Hasło jest za słabe"
                  }
                })} 
                type="password" 
                placeholder="Nowe hasło" 
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Input 
                {...register("confirmPassword", { 
                  required: "Potwierdzenie hasła jest wymagane",
                  validate: (val) => {
                    if (watch('password') != val) {
                      return "Hasła nie są identyczne";
                    }
                  }
                })} 
                type="password" 
                placeholder="Potwierdź hasło"
                className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-md border text-[11px]">
                {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {req.met ? (
                            <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-green-600" />
                            </div>
                        ) : (
                            <div className="h-4 w-4 rounded-full bg-muted border flex items-center justify-center shrink-0">
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                            </div>
                        )}
                        <span className={cn(req.met ? "text-green-600 font-medium" : "text-muted-foreground")}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zmień hasło
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}