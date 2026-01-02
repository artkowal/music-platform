import { Building2, CalendarCheck, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "1. Stwórz swoją przestrzeń",
    desc: "Zarejestruj się i zdefiniuj swoje placówki muzyczne. Twórz kursy grupowe lub indywidualne i układaj materiał w przejrzyste lekcje."
  },
  {
    icon: CalendarCheck,
    title: "2. Planuj i nauczaj",
    desc: "Umawiaj zajęcia stacjonarne lub online (Zoom) w interaktywnym kalendarzu. Komunikuj się z uczniami na czacie dedykowanym dla każdej lekcji."
  },
  {
    icon: TrendingUp,
    title: "3. Monitoruj i zarządzaj",
    desc: "Śledź postępy uczniów, weryfikuj miesięczny harmonogram i kontroluj budżety swoich placówek – wszystko w jednym miejscu."
  }
];

export function HomeSteps() {
  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Jak to działa?
          </h2>
          <p className="text-muted-foreground text-lg">
            Kompleksowy proces w trzech prostych krokach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0" />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 relative z-10 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:border-primary/50">
                <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <step.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}