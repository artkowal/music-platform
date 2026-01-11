import { Layers, Globe, Database, Server, Lock, type LucideIcon } from "lucide-react";

export function HomeIntegrations() {
  return (
    <section className="py-24 border-y bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-10">
          Zasilane przez nowoczesne technologie
        </p>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          <TechItem icon={Globe} label="React 18" />
          <TechItem icon={Server} label="Node.js" />
          <TechItem icon={Database} label="MySQL" />
          <TechItem icon={Layers} label="Socket.io" />
          <TechItem icon={Lock} label="JWT Auth" />
        </div>
      </div>
    </section>
  );
}

function TechItem({ icon: Icon, label }: { icon: LucideIcon, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="p-4 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-8 w-8 group-hover:text-primary transition-colors" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}