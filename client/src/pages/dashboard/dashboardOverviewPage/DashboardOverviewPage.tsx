import { useEffect } from "react";
import { useWorkplace } from "@/context/WorkplaceContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, CheckSquare } from "lucide-react";
import { RecentActivity } from "./components/RecentActivity";

export default function DashboardOverviewPage() {
  const { setActiveWorkplace } = useWorkplace();

  useEffect(() => {
    setActiveWorkplace(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Przegląd</h2>
            <p className="text-muted-foreground">Witaj z powrotem! Oto co się dzieje.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Calendar className="mr-2 h-4 w-4"/> Otwórz Kalendarz</Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">

          <div className="col-span-1 lg:col-span-2">
             <RecentActivity />
          </div>
          
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Video className="h-5 w-5 text-primary" /> Nadchodzące zajęcia
                </CardTitle>
                <CardDescription>Masz 2 zaplanowane lekcje na dziś.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-3">
                 {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-2.5 rounded-md text-center min-w-[60px]">
                                <span className="block text-xs text-muted-foreground uppercase font-bold">Dzisiaj</span>
                                <span className="block text-sm font-bold">1{4+i}:00</span>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Pianino - Jan Kowalski</p>
                                <p className="text-xs text-muted-foreground">Szkoła Muzyczna w Radomiu</p>
                            </div>
                        </div>
                        <Button size="sm" variant="secondary">Dołącz</Button>
                    </div>
                 ))}
             </CardContent>
          </Card>

          <Card className="shadow-sm">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckSquare className="h-5 w-5 text-orange-500" /> Zadania
                </CardTitle>
                <CardDescription>Prace domowe do sprawdzenia.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <div className="text-4xl font-bold">5</div>
                        <p className="text-sm text-muted-foreground">oczekujących</p>
                    </div>
                    <div className="h-12 w-px bg-border mx-4"></div>
                    <div>
                        <div className="text-4xl font-bold text-muted-foreground">2</div>
                        <p className="text-sm text-muted-foreground">po terminie</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full mt-2">Zobacz listę zadań</Button>
             </CardContent>
          </Card>

      </div>
    </div>
  );
}