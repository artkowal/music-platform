import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Clock } from "lucide-react";

export function DashboardClock() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-muted/20 border-primary/20 shadow-sm overflow-hidden relative">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />

      <CardContent className="p-6 flex items-center justify-between relative z-10">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-foreground tabular-nums leading-none">
              {format(date, "HH:mm:ss")}
           </h2>
           <p className="text-sm text-muted-foreground mt-1 capitalize font-medium">
              {format(date, "EEEE, d MMMM yyyy", { locale: pl })}
           </p>
        </div>
        
        <div className="h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm border flex items-center justify-center text-primary shadow-sm">
            <Clock className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}