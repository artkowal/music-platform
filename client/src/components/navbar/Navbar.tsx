"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, UserPlus, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { NavbarBreadcrumbs } from "./components/NavbarBreadcrumbs";
import { NavbarUserDesktop } from "./components/NavbarUserDesktop"; 
import { NavbarUserMobile } from "./components/NavbarUserMobile";   
import { NavbarMobileMenu } from "./components/NavbarMobileMenu";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <header className={cn(
      "top-0 z-50 bg-background/80 backdrop-blur-sm",
      isDashboard ? "sticky" : "fixed left-0 right-0"
    )}>
      <nav className="flex h-16 items-center justify-between px-4">
        
        <div className="flex items-center gap-3">
          {isDashboard ? (
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <NavbarBreadcrumbs />
            </>
          ) : (
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
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user ? (
            <NavbarUserDesktop /> 
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          
          {!user && !isDashboard && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Otwórz menu</span>
            </Button>
          )}
          
          {user && (
             <NavbarUserMobile /> 
          )}
        </div>
      </nav>

      {!user && (
        <NavbarMobileMenu 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}
      
      <hr className="border-border" />
    </header>
  );
}