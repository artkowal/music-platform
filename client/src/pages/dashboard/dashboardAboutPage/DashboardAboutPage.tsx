import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AboutHeader } from "./components/AboutHeader"; // <--- Import nowego headera
import { Music2, Heart } from "lucide-react";

export default function DashboardAboutPage() {
  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      <AboutHeader />

      <div className="max-w-2xl mx-auto px-2 md:px-0">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
             <Music2 className="h-16 w-16 text-primary/20" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">MusicDesk</CardTitle>
                <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <CardDescription>
                Kompleksowy system zarządzania edukacją muzyczną.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Platforma MusicDesk została stworzona, aby ułatwić nauczycielom i uczniom organizację zajęć muzycznych. 
              Nasz cel to wyeliminowanie papierologii i chaosu w harmonogramach, pozwalając skupić się na tym, co najważniejsze – muzyce.
            </p>
            <p>
              Dzięki MusicDesk możesz zarządzać swoimi kursami, lekcjami, materiałami dydaktycznymi oraz finansami w jednym, przejrzystym miejscu.
            </p>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-4 flex justify-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
                Zbudowano z <Heart className="h-3 w-3 text-red-500 fill-red-500" /> dla muzyków.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}