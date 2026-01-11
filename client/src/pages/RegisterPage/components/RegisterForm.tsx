"use client";
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import registerImage from "@/assets/images/register_image.webp";
import logo from "@/assets/logo.png";


// Regex do hasła
const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;

// Schemat Zod
const formSchema = z
  .object({
    firstName: z.string().min(2, { message: "Imię musi mieć co najmniej 2 znaki." }),
    lastName: z.string().min(2, { message: "Nazwisko musi mieć co najmniej 2 znaki." }),
    email: z.string().email({ message: "Niepoprawny adres email." }),
    password: z.string().regex(passwordRegex, { 
      message: "Hasło jest za słabe (sprawdź wymagania poniżej)." 
    }),
    confirmPassword: z.string(),
    role: z.enum(["student", "teacher"], {
      message: "Musisz wybrać rolę.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmPassword"],
  });

type RegisterFormProps = React.ComponentProps<"div">;

export function RegisterForm({ className, ...props }: RegisterFormProps) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  const passwordValue = form.watch("password");

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setApiError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = values;
      await register(registerData);
      navigate("/dashboard");
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any; 
      setApiError(err.response?.data?.message || "Wystąpił błąd podczas rejestracji.");
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          
          <div className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                
                <div className="flex flex-col items-center gap-2 text-center mb-4">
                  <img src={logo} alt="MusicDesk Logo" className="h-16 w-16" />
                  <h1 className="text-2xl font-bold">Utwórz swoje konto</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Wypełnij formularz poniżej, aby założyć konto.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imię</FormLabel>
                        <FormControl>
                          <Input placeholder="Jan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazwisko</FormLabel>
                        <FormControl>
                          <Input placeholder="Kowalski" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hasło</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potwierdź hasło</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jestem...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz swoją rolę" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Uczniem</SelectItem>
                          <SelectItem value="teacher">Nauczycielem</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {apiError && (
                  <p className="text-sm font-medium text-destructive">{apiError}</p>
                )}

                <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Tworzenie konta..." : "Utwórz konto"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Lub
                    </span>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Masz już konto?{" "}
                  <Link to="/login" replace className="font-semibold text-primary hover:underline">
                    Zaloguj się
                  </Link>
                </div>
              </form>
            </Form>
          </div>

          <div className="bg-muted relative hidden md:block">
            <img
              src={registerImage}
              alt="MusicDesk"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-75"
              onError={(e) => (e.currentTarget.src = "https://placehold.co/800x1200/222/fff?text=MusicDesk")}
            />
          </div>
        </CardContent>
      </Card>

      <p className="px-6 text-center text-xs text-muted-foreground">
        Klikając Kontynuuj, zgadzasz się z naszymi{" "}
        <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
          Warunkami
        </Link>{" "}
        i{" "}
        <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
          Polityką prywatności
        </Link>
        .
      </p>
    </div>
  );
}