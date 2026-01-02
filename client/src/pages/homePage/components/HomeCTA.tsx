import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HomeCTA() {
  return (
    <section className="py-32 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="relative rounded-3xl overflow-hidden border border-border bg-foreground text-background px-6 py-20 md:px-20 text-center shadow-2xl">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                    Gotowy na zmianę rytmu?
                </h2>
                <p className="text-lg text-background/80 mb-10 max-w-2xl mx-auto">
                    Dołącz do platformy stworzonej z pasji do edukacji i technologii.
                    <br />
                    <b>Bez żadnych ukrytych opłat.</b>
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-12 px-8 rounded-full bg-background text-foreground hover:bg-background/90 font-semibold transition-colors">
                        <Link to="/register">Załóż darmowe konto</Link>
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}