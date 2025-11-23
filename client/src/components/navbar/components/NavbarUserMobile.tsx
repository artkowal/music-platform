import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";

export function NavbarUserMobile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  if (!user) return null;

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  
  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.[0] || '';
    const l = lastName?.[0] || '';
    return (f + l).toUpperCase() || '??';
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar>
            <AvatarImage src="/avatar-placeholder.png" alt={fullName} />
            <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="rounded-t-xl px-4 pb-8 pt-4">
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Twoje konto</SheetTitle>
          <SheetDescription className="hidden">Menu użytkownika</SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-4 mb-6 bg-muted/30 p-4 rounded-lg border">
          <Avatar className="h-12 w-12 border-2 border-background">
            <AvatarImage src="/avatar-placeholder.png" alt={fullName} />
            <AvatarFallback className="text-lg font-bold">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg leading-none">{fullName}</p>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-2 capitalize">
                {user.role === 'teacher' ? 'Nauczyciel' : 'Uczeń'}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="justify-start gap-3 h-12 text-base font-normal"
            onClick={() => handleNavigate('/dashboard')}
          >
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
            Dashboard
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            className="justify-start gap-3 h-12 text-base font-normal"
            onClick={() => handleNavigate('/dashboard/settings')}
          >
            <User className="h-5 w-5 text-muted-foreground" />
            Ustawienia konta
          </Button>

          <Separator className="my-2" />

          <Button 
            variant="destructive" 
            size="lg" 
            className="justify-start gap-3 h-12"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Wyloguj się
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}