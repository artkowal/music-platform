"use client";

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, UserPlus, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const getBreadcrumbName = (path: string) => {
  if (path.endsWith("/settings")) return "Ustawienia";
  if (path.endsWith("/about")) return "O Projekcie";
  if (path.endsWith("/courses")) return "Moje kursy";
  if (path.endsWith("/students")) return "Uczniowie";
  if (path.endsWith("/my-learning")) return "Moja nauka";
  return "Przegląd";
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const breadcrumbName = isDashboard ? getBreadcrumbName(location.pathname) : "";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getInitials = (firstName: string = '', lastName: string = '') => {
    const fNameInitial = firstName ? firstName[0] : '';
    const lNameInitial = lastName ? lastName[0] : '';
    return `${fNameInitial}${lNameInitial}`.toUpperCase() || '??';
  };
  
  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
  const initials = user ? getInitials(user.first_name, user.last_name) : '??';

  return (
    <header className={cn(
      "top-0 z-50 bg-background/80 backdrop-blur-sm",
      isDashboard ? "sticky" : "fixed left-0 right-0"
    )}>
      <nav className="flex h-16 items-center justify-between px-4">
        
        <div className="flex items-center gap-3">
          {isDashboard ? (
            // WIDOK DLA DASHBOARDU
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumbName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </>
          ) : (
            // WIDOK PUBLICZNY
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

        {/* PRAWA STRONA */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/avatar-placeholder.png" alt={fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Wyloguj się</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* PRZYCISKI MOBILNE */}
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
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/avatar-placeholder.png" alt={fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Wyloguj się</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {/* WYSUWANE MENU MOBILNE */}
      {isMobileMenuOpen && !user && (
        <div className="absolute top-16 left-0 w-full animate-accordion-down border-t bg-background p-4 shadow-md md:hidden">
          <div className="flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Zaloguj się
              </Link>
              </Button>
            <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
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