import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/api/axios";
import type { AxiosResponse, AxiosError } from "axios";

export function GlobalToastHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const resInterceptor = api.interceptors.response.use(
      (response: AxiosResponse) => {
        const { method } = response.config;
        const successMessage = response.data?.message;

        if (successMessage && method && ['post', 'put', 'delete'].includes(method.toLowerCase())) {
          toast({
            variant: "success",
            title: "Sukces",
            description: successMessage,
            duration: 3000,
          });
        }
        return response;
      },
      
      (error: AxiosError<{ message: string }>) => {
        const errorMessage = error.response?.data?.message || "Wystąpił nieoczekiwany błąd.";
        
        if (error.response?.status !== 401) {
            toast({
                variant: "destructive",
                title: "Błąd",
                description: errorMessage,
                duration: 5000,
            });
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(resInterceptor);
    };
  }, [toast]);

  return null;
}