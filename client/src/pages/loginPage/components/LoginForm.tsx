"use client";

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

// 1. Schemat walidacji
const formSchema = z.object({
  email: z.string().email({ message: "Niepoprawny adres email." }),
  password: z.string().min(1, { message: "Hasło jest wymagane." }),
});

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  // 2. Ustawienia React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 3. Funkcja obsługi wysyłania formularza
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setApiError(null);
    try {
      await login(values);
      navigate("/dashboard");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || "Wystąpił błąd podczas logowania.");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Witaj z powrotem</CardTitle>
        <CardDescription className="text-center">
          Wprowadź dane, aby zalogować się na konto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Hasło</FormLabel>
                    {/* <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Nie pamiętasz hasła?
                    </Link> */}
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {apiError && (
              <p className="text-sm font-medium text-destructive">{apiError}</p>
            )}

            <Button type="submit" className="w-full mt-5" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm">
          Nie masz konta?{" "}
          <Link to="/register" className="underline font-semibold text-primary">
            Zarejestruj się
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}