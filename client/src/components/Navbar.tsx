
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, UserPlus, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <nav className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link 
          to="/" 
          className="flex items-center gap-3"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img src={logo} alt="MusicDesk Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-text-primary">
            MusicDesk
          </span>
        </Link>

        {/* --- NAWIGACJA DESKTOPOWA --- */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Zaloguj się
            </Link>
          </Button>
          <Button asChild>
            <Link to="/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Zarejestruj się
            </Link>
          </Button>
        </div>

        {/* --- PRZYCISKI MOBILNE (Hamburger i Motyw) --- */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Otwórz menu</span>
          </Button>
        </div>
      </nav>

      {/* --- WYSUWANE MENU MOBILNE --- */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full animate-accordion-down border-t bg-background p-4 shadow-md md:hidden">
          <div className="flex flex-col gap-4">
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Zaloguj się
              </Link>
            </Button>
            <Button 
              asChild 
              className="w-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Link to="/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Zarejestruj się
              </Link>
            </Button>
          </div>
        </div>
      )}
      <hr className="border-border" />
    </header>
  );
}