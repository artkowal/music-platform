import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import logo from "@/assets/logo.png";

export function HomeHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-background">
      
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] dark:opacity-[0.05]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[128px] opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[128px] opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[128px] opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
            
            {/* LEWA KOLUMNA */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
                  Twoja muzyczna <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient-x bg-[length:200%_auto] pb-2">
                    pracownia w chmurze.
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Zaprojektowany dla nauczycieli. 
                  Jeden system do zarządzania lekcjami, uczniami, kalendarzem i finansami.
                  Bez zbędnego chaosu.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
                  <Button asChild size="lg" className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                    <Link to="/register">
                      Rozpocznij za darmo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base rounded-full backdrop-blur-sm bg-background/30 border-border hover:bg-muted/50 transition-all w-full sm:w-auto">
                    <Link to="/login">
                      <PlayCircle className="mr-2 h-4 w-4" /> Zaloguj się
                    </Link>
                  </Button>
                </div>
            </div>

            {/* PRAWA KOLUMNA */}
            <div className="flex justify-center md:justify-end animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                <div className="relative group">
                    <div className="absolute -inset-10 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700" />
                    
                    <img 
                        src={logo} 
                        alt="MusicDesk Big Logo" 
                        className="w-64 h-64 md:w-80 md:h-80 lg:w-[450px] lg:h-[450px] object-contain relative z-10 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500" 
                    />
                </div>
            </div>
        </div>


        {/* Mockup Interfejsu */}
        <div className="w-full max-w-5xl mx-auto relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl blur opacity-30 animate-pulse"></div>
            <div className="relative rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden">
                {/* Pasek okna */}
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-4 px-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="mx-auto w-1/3 h-2 rounded-full bg-muted/50 opacity-50"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-64 md:h-[500px] w-full bg-background/40 rounded-lg relative overflow-hidden group">
                     <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold text-2xl md:text-4xl uppercase tracking-widest group-hover:scale-110 transition-transform duration-700">
                        Dashboard Preview
                     </div>
                     <div className="md:col-span-2 flex flex-col gap-4 p-4">
                        <div className="h-1/3 rounded-lg bg-muted/40 w-full animate-pulse delay-75"></div>
                        <div className="h-2/3 rounded-lg bg-muted/40 w-full animate-pulse delay-150"></div>
                     </div>
                     <div className="hidden md:flex flex-col gap-4 p-4 pl-0">
                        <div className="h-full rounded-lg bg-muted/40 w-full animate-pulse delay-300"></div>
                     </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}