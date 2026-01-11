import { 
  Video, Calendar, Wallet, MessageCircle, FileMusic 
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Integracja Zoom",
    desc: "Automatyczne linki do lekcji. Koniec z wysyłaniem zaproszeń ręcznie.",
    icon: Video,
    color: "bg-blue-500/10 text-blue-500",
    className: "md:col-span-2",
  },
  {
    title: "Finanse pod kontrolą",
    desc: "Śledź płatności i dochody w czasie rzeczywistym.",
    icon: Wallet,
    color: "bg-green-500/10 text-green-500",
    className: "md:col-span-1",
  },
  {
    title: "Inteligentny Kalendarz",
    desc: "Zarządzaj dostępnością i odwołuj lekcje jednym kliknięciem.",
    icon: Calendar,
    color: "bg-orange-500/10 text-orange-500",
    className: "md:col-span-1",
  },
  {
    title: "Czat na żywo",
    desc: "Błyskawiczna komunikacja z uczniami oparta o WebSocket.",
    icon: MessageCircle,
    color: "bg-purple-500/10 text-purple-500",
    className: "md:col-span-1",
  },
  {
    title: "Baza Materiałów",
    desc: "Nuty, nagrania i pliki PDF w jednym miejscu. Pełna kompatybilność.",
    icon: FileMusic,
    color: "bg-rose-500/10 text-rose-500",
    className: "md:col-span-1",
  },
];

export function HomeFeatures() {
  return (
    <section className="py-24 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Wszystko, czego potrzebujesz.
          </h2>
          <p className="text-lg text-muted-foreground">
            Zamiast pięciu różnych aplikacji – jedna, spójna platforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((item, i) => (
            <div 
              key={i} 
              className={cn(
                "group relative overflow-hidden rounded-3xl bg-card border border-border p-8 hover:shadow-xl transition-all duration-300",
                item.className
              )}
            >
              <div className={cn("mb-6 inline-flex p-3 rounded-2xl", item.color)}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              
              <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                <item.icon className="h-64 w-64" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}