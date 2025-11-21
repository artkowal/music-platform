import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface NavbarMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavbarMobileMenu({ isOpen, onClose }: NavbarMobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-0 w-full animate-accordion-down border-t bg-background p-4 shadow-md md:hidden">
      <div className="flex flex-col gap-4">
        <Button asChild variant="outline" className="w-full" onClick={onClose}>
          <Link to="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Zaloguj się
          </Link>
        </Button>
        <Button asChild className="w-full" onClick={onClose}>
          <Link to="/register">
            <UserPlus className="mr-2 h-4 w-4" />
            Zarejestruj się
          </Link>
        </Button>
      </div>
    </div>
  );
}