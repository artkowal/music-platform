import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutDashboard } from "lucide-react";
import type { User } from "@/types/User";

interface DashboardOverviewHeaderProps {
  user: User | null;
}

export function DashboardOverviewHeader({ user }: DashboardOverviewHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
                <LayoutDashboard className="h-5 w-5" />
            </div>
            
            <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Pulpit</h1>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    Cześć {user?.first_name || "użytkowniku"}! Oto co się dzieje w Twojej muzyce.
                </p>
            </div>
        </div>

        <div className="shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/calendar')}>
                <Calendar className="mr-2 h-4 w-4"/> 
                <span className="hidden sm:inline">Kalendarz</span>
                <span className="inline sm:hidden">Kal.</span>
            </Button>
        </div>

      </div>
    </div>
  );
}