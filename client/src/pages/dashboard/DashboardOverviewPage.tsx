import { useEffect } from "react";
import { useWorkplace } from "@/context/WorkplaceContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, CheckSquare, Bell, Clock } from "lucide-react";

export default function DashboardOverviewPage() {
  const { setActiveWorkplace } = useWorkplace();

  useEffect(() => {
    setActiveWorkplace(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Przegląd</h2>
            <p className="text-muted-foreground">Co masz dzisiaj do zrobienia.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Calendar className="mr-2 h-4 w-4"/> Otwórz Kalendarz</Button>
        </div>
      </div>

      {/* --- GŁÓWNE KARTY (Makieta UI) --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="lg:col-span-2 bg-primary/5 border-primary/20">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" /> Dzisiejsze zajęcia online
                </CardTitle>
                <CardDescription>Masz 3 zaplanowane lekcje na dziś.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between bg-background p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <div className="bg-muted p-2 rounded-md text-xs font-bold">1{4+i}:00</div>
                            <div>
                                <p className="font-semibold text-sm">Pianino - Jan Kowalski</p>
                                <p className="text-xs text-muted-foreground">Szkoła Muzyczna w Radomiu</p>
                            </div>
                        </div>
                        <Button size="sm">Dołącz</Button>
                    </div>
                 ))}
             </CardContent>
          </Card>

          <Card className="lg:col-span-1">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-orange-500" /> Zadania
                </CardTitle>
                <CardDescription>Prace domowe od uczniów.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="text-3xl font-bold mb-2">5</div>
                <p className="text-xs text-muted-foreground mb-4">oczekujących na sprawdzenie</p>
                <Button variant="secondary" className="w-full">Sprawdź teraz</Button>
             </CardContent>
          </Card>
          
          <Card className="lg:col-span-1">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" /> Powiadomienia
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex gap-3 items-start text-sm">
                    <div className="bg-blue-100 text-blue-600 p-1 rounded-full mt-0.5"><Clock className="h-3 w-3"/></div>
                    <div>
                        <p className="font-medium">Nowy uczeń</p>
                        <p className="text-xs text-muted-foreground">Anna Nowak dołączyła do kursu Gitara.</p>
                    </div>
                </div>
             </CardContent>
          </Card>
      </div>
    </div>
  );
}