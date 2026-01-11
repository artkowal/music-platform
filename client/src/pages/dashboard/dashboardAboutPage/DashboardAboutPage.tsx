import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AboutHeader } from "./components/AboutHeader";
import { 
  Music2, GraduationCap, Code2, Database, 
  Server, Video, CalendarClock, Wallet, Layers, 
  Zap, ShieldCheck, Globe
} from "lucide-react";

const technologies = [
  { name: "React 18", color: "bg-[#61DAFB]/10 text-[#61DAFB] border-[#61DAFB]/20", icon: Code2 },
  { name: "TypeScript", color: "bg-[#3178C6]/10 text-[#3178C6] border-[#3178C6]/20", icon: Layers },
  { name: "Node.js", color: "bg-[#339933]/10 text-[#339933] border-[#339933]/20", icon: Server },
  { name: "Express.js", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", icon: Globe },
  { name: "MySQL", color: "bg-[#4479A1]/10 text-[#4479A1] border-[#4479A1]/20", icon: Database },
  { name: "Socket.io", color: "bg-foreground/5 text-foreground border-foreground/10", icon: Zap },
  { name: "Zoom SDK", color: "bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20", icon: Video },
  { name: "Tailwind CSS", color: "bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20", icon: Code2 },
];

export default function DashboardAboutPage() {
  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      <AboutHeader />

      <div className="max-w-6xl mx-auto px-4 md:px-0 space-y-8">
        
        {/* SEKCJA 1: Praca Inżynierska (Hero) */}
        <Card className="overflow-hidden border-primary/20 shadow-md">
          {/* Zmieniono h-48 na min-h-[...], aby na telefonach tekst się nie uciął */}
          <div className="relative min-h-[16rem] md:min-h-[20rem] bg-gradient-to-r from-primary/90 via-primary to-indigo-600 flex flex-col items-center justify-center text-primary-foreground p-8 md:p-12 text-center">
             <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
             
             {/* Powiększona ikona: h-20 na mobile, h-24 na desktopie */}
             <GraduationCap className="h-20 w-20 md:h-24 md:w-24 mb-6 opacity-90 drop-shadow-md" />
             
             <h1 className="text-3xl md:text-5xl font-bold tracking-tight drop-shadow-sm">
                MusicDesk Platform
             </h1>
             
             <p className="text-primary-foreground/90 mt-4 max-w-2xl text-base md:text-xl font-light leading-relaxed">
               Projekt inżynierski zrealizowany w ramach studiów na kierunku Informatyka.
             </p>
             
             <Badge variant="secondary" className="mt-6 bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-xs md:text-sm">
                Specjalizacja: Inżynieria Oprogramowania • 2022-2026
             </Badge>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Lewa kolumna - szersza (zajmuje 2/3 na dużym ekranie) */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* SEKCJA 2: Geneza */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                            <Music2 className="h-6 w-6 text-primary" />
                            Geneza projektu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                        <p>
                            Przez ostatnie <strong>4 lata pracy jako nauczyciel gry na fortepianie</strong>, miałem okazję przetestować w praktyce wiele popularnych narzędzi, które teoretycznie miały wspomagać edukację. Szybko jednak zauważyłem ich zasadnicze wady w kontekście specyfiki lekcji muzyki.
                        </p>
                        <p>
                            Dostępne na rynku aplikacje były albo zbyt ogólne, albo wymuszały korzystanie z wielu rozproszonych rozwiązań jednocześnie. Żonglowanie między kalendarzem Google, komunikatorem do przesyłania nut, a excelem wprowadzało chaos i odciągało uwagę.
                        </p>
                        <div className="bg-primary/5 p-4 md:p-6 rounded-lg border-l-4 border-primary text-foreground italic my-6">
                            "Zamiast dostosowywać się do ograniczeń istniejących narzędzi, postanowiłem napisać własne, dedykowane oprogramowanie, które rozwiązuje te problemy u źródła."
                        </div>
                        <p>
                            MusicDesk powstał z potrzeby stworzenia jednego, spójnego ekosystemu, który eliminuje "technologiczny szum" i pozwala nauczycielom skupić się wyłącznie na dydaktyce.
                        </p>
                    </CardContent>
                </Card>

                {/* Tech Stack */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                            <Code2 className="h-6 w-6 text-primary" />
                            Technologie i Architektura
                        </CardTitle>
                        <CardDescription>
                            Nowoczesny stos technologiczny zapewniający wydajność i bezpieczeństwo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {technologies.map((tech) => (
                                <div 
                                    key={tech.name} 
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-sm cursor-default ${tech.color}`}
                                >
                                    <tech.icon className="h-8 w-8 mb-3 opacity-80" />
                                    <span className="font-bold text-sm text-center">{tech.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Co potrafi system?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        <div className="flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                <Video className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Integracja Zoom</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-normal">Automatyczne generowanie linków do lekcji online bez wychodzenia z aplikacji.</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                                <CalendarClock className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Inteligentny Kalendarz</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-normal">Zarządzanie dostępnością, odwoływanie lekcji i historia spotkań.</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Komunikacja Real-time</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-normal">Czat na żywo i powiadomienia oparte o technologię WebSocket.</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Moduł Finansowy</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-normal">Śledzenie płatności, rozliczenia miesięczne i statystyki dochodów.</p>
                            </div>
                        </div>

                         <Separator />

                        <div className="flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Bezpieczeństwo</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-normal">Autoryzacja JWT, bezpieczne hasła i ochrona danych osobowych.</p>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Card className="border-indigo-500/20 bg-indigo-500/5">
                    <CardContent className="p-6 text-center">
                        <p className="text-sm font-medium text-indigo-600 mb-2">
                            Status projektu
                        </p>
                        <div className="text-2xl font-bold mb-1">Wersja 1.0.0</div>
                        <p className="text-xs text-muted-foreground">
                            Gotowy do wdrożenia
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* STOPKA */}
        <div className="text-center py-8">
            <p className="text-xs text-muted-foreground mt-2 opacity-50">
                © 2026 ArtKowal. Wszelkie prawa zastrzeżone.
            </p>
        </div>

      </div>
    </div>
  );
}