import { useState } from "react";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountSectionProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function DeleteAccountSection({ isLoading, setIsLoading }: DeleteAccountSectionProps) {
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const handleDeleteRequest = async () => {
        if (!confirm("Czy na pewno chcesz rozpocząć procedurę usuwania konta? Wyślemy Ci email potwierdzający.")) {
            return;
        }

        setIsLoading(true);
        try {
            await authApi.requestDeleteAccount();
            setIsSent(true);
            toast({
                title: "Wysłano email",
                description: "Sprawdź swoją skrzynkę pocztową, aby dokończyć usuwanie konta.",
                variant: "success"
            });
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;
            
            toast({
                title: "Błąd",
                description: error.response?.data?.message || "Nie udało się wysłać żądania.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="flex flex-col items-start gap-3 animate-in fade-in">
                <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md flex items-center gap-2 text-sm border border-green-500/20">
                    <Mail className="h-4 w-4" />
                    Wysłaliśmy link potwierdzający na Twój email.
                </div>
                <p className="text-sm text-muted-foreground">
                    Jeśli nie widzisz wiadomości, sprawdź folder SPAM.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                Aby trwale usunąć konto, kliknij poniższy przycisk. Ze względów bezpieczeństwa wyślemy Ci link potwierdzający na adres email.
            </p>
            <Button 
                variant="destructive" 
                onClick={handleDeleteRequest} 
                disabled={isLoading}
                className="w-full sm:w-auto"
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rozpocznij usuwanie konta
            </Button>
        </div>
    );
}