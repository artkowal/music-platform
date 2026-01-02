import logo from "@/assets/logo.png";

export function HomeFooter() {
  return (
    <footer className="border-t border-border py-8 bg-muted/20 text-muted-foreground">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 font-semibold text-foreground">
          <img src={logo} alt="MusicDesk Logo" className="h-6 w-6" />
          MusicDesk
        </div>
        
        <p className="text-xs text-center md:text-right opacity-80">
          © 2026 ArtKowal. Projekt inżynierski.
        </p>
      </div>
    </footer>
  );
}