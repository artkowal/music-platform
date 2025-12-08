import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/context/NotificationContext";
import { usersApi } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock, Bell, Loader2, Save, Check} from "lucide-react";
import { DeleteAccountSection } from "./components/DeleteAccountSection";
import { cn } from "@/lib/utils";

export default function DashboardSettingsPage() {
  const { user } = useAuth();
  const { isSoundEnabled, toggleSound } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
  });

  const [passData, setPassData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
  });

  // --- LOGIKA SPRAWDZANIA HASŁA (LIVE) ---
  const passwordRequirements = useMemo(() => {
    const pwd = passData.newPassword;
    return [
        { label: "Minimum 8 znaków", met: pwd.length >= 8 },
        { label: "Przynajmniej jedna duża litera", met: /[A-Z]/.test(pwd) },
        { label: "Przynajmniej jedna mała litera", met: /[a-z]/.test(pwd) },
        { label: "Przynajmniej jedna cyfra", met: /[0-9]/.test(pwd) },
        { label: "Przynajmniej jeden znak specjalny", met: /[^A-Za-z0-9]/.test(pwd) },
    ];
  }, [passData.newPassword]);

  const isPasswordValid = passwordRequirements.every(req => req.met);
  const doPasswordsMatch = passData.newPassword === passData.confirmPassword && passData.newPassword !== "";

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await usersApi.updateProfile(profileData);
          alert("Profil zaktualizowany pomyślnie!"); 
      } catch (err) {
          const error = err as { response?: { data?: { message?: string } } };
          alert("Błąd: " + (error.response?.data?.message || "Nie udało się zapisać"));
      } finally {
          setIsLoading(false);
      }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!doPasswordsMatch) return;
      if (!isPasswordValid) return;

      setIsLoading(true);
      try {
          await usersApi.changePassword({
              currentPassword: passData.currentPassword,
              newPassword: passData.newPassword
          });
          alert("Hasło zostało zmienione.");
          setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } catch (err) {
          const error = err as { response?: { data?: { message?: string } } };
          alert("Błąd: " + (error.response?.data?.message || "Nie udało się zmienić hasła"));
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ustawienia</h2>
        <p className="text-muted-foreground">Zarządzaj swoim kontem i preferencjami aplikacji.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2"><User className="h-4 w-4"/> Profil</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Lock className="h-4 w-4"/> Bezpieczeństwo</TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2"><Bell className="h-4 w-4"/> Preferencje</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <form onSubmit={handleProfileUpdate}>
                <CardHeader>
                <CardTitle>Dane osobowe</CardTitle>
                <CardDescription>
                    Tutaj możesz zmienić swoje imię i nazwisko widoczne dla innych.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Imię</Label>
                            <Input 
                                id="firstName" 
                                value={profileData.first_name}
                                onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nazwisko</Label>
                            <Input 
                                id="lastName" 
                                value={profileData.last_name}
                                onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Adres Email</Label>
                        <Input id="email" value={user?.email || ""} disabled className="bg-muted opacity-70 cursor-not-allowed" />
                        <p className="text-[10px] text-muted-foreground">Zmiana adresu email wymaga kontaktu z administratorem.</p>
                    </div>
                </CardContent>
                <CardFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Zapisz zmiany
                </Button>
                </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <form onSubmit={handlePasswordUpdate}>
                <CardHeader>
                <CardTitle>Zmiana hasła</CardTitle>
                <CardDescription>
                    Aby zmienić hasło, musisz podać swoje obecne hasło dla weryfikacji.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    
                    <div className="space-y-2">
                        <Label htmlFor="current">Obecne hasło</Label>
                        <Input 
                            id="current" 
                            type="password" 
                            value={passData.currentPassword}
                            onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                            required
                        />
                    </div>

                    <div className="border-t pt-4"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new">Nowe hasło</Label>
                                <Input 
                                    id="new" 
                                    type="password" 
                                    value={passData.newPassword}
                                    onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Powtórz nowe hasło</Label>
                                <Input 
                                    id="confirm" 
                                    type="password" 
                                    value={passData.confirmPassword}
                                    onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                    className={cn(
                                        passData.confirmPassword && !doPasswordsMatch ? "border-destructive focus-visible:ring-destructive" : ""
                                    )}
                                />
                                {passData.confirmPassword && !doPasswordsMatch && (
                                    <p className="text-xs text-destructive font-medium animate-in fade-in">Hasła nie są identyczne</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg border text-sm space-y-3">
                            <p className="font-medium mb-2 text-muted-foreground">Wymagania hasła:</p>
                            <ul className="space-y-2">
                                {passwordRequirements.map((req, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        {req.met ? (
                                            <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                                <Check className="h-3 w-3 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                                            </div>
                                        )}
                                        <span className={cn(
                                            "transition-colors duration-200",
                                            req.met ? "text-green-600 font-medium" : "text-muted-foreground"
                                        )}>
                                            {req.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </CardContent>
                <CardFooter>
                <Button 
                    type="submit" 
                    disabled={isLoading || !isPasswordValid || !doPasswordsMatch || !passData.currentPassword}
                    className="w-full sm:w-auto"
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Zmień hasło
                </Button>
                </CardFooter>
            </form>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
                <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
                <CardDescription>
                    Tej operacji nie można cofnąć. Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, kursów i historii.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DeleteAccountSection isLoading={isLoading} setIsLoading={setIsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia aplikacji</CardTitle>
              <CardDescription>
                Dostosuj zachowanie aplikacji do swoich potrzeb.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Dźwięki powiadomień</Label>
                  <p className="text-sm text-muted-foreground">
                    Odtwarzaj dźwięk, gdy otrzymasz nowe powiadomienie (np. nowa lekcja, wiadomość).
                  </p>
                </div>
                <Switch 
                    checked={isSoundEnabled}
                    onCheckedChange={toggleSound}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}