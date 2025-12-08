import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface DeleteAccountSectionProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function DeleteAccountSection({ isLoading, setIsLoading }: DeleteAccountSectionProps) {
    const { logout } = useAuth();
    const [password, setPassword] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);

    const handleDelete = async () => {
        if (!password) {
            alert("Podaj hasło, aby potwierdzić.");
            return;
        }
        if (!confirm("Czy jesteś absolutnie pewien? To usunie WSZYSTKIE Twoje dane bezpowrotnie.")) {
            return;
        }

        setIsLoading(true);
        try {
            await usersApi.deleteAccount(password);
            alert("Konto zostało usunięte.");
            logout(); 
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            alert("Błąd: " + (error.response?.data?.message || "Nie udało się usunąć konta. Sprawdź hasło."));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConfirming) {
        return (
            <Button variant="destructive" onClick={() => setIsConfirming(true)}>
                Usuń moje konto
            </Button>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2 w-full max-w-sm">
                <Label htmlFor="del-pass" className="text-destructive font-semibold">Potwierdź hasłem</Label>
                <Input 
                    id="del-pass" 
                    type="password" 
                    placeholder="Twoje hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background"
                />
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setIsConfirming(false); setPassword(""); }}>
                    Anuluj
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Potwierdzam usunięcie
                </Button>
            </div>
        </div>
    );
}