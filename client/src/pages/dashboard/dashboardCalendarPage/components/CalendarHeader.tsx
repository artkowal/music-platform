import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarOff, Plus } from "lucide-react";

interface CalendarHeaderProps {
  isTeacher: boolean;
  onAddEvent: () => void;
  onAddTimeOff: () => void;
}

export function CalendarHeader({ isTeacher, onAddEvent, onAddTimeOff }: CalendarHeaderProps) {
  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 border-b bg-background px-6 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
                <CalendarDays className="h-5 w-5" />
            </div>
            
            <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Kalendarz zajęć</h1>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj swoim grafikiem i planuj spotkania.
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
            {isTeacher && (
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onAddTimeOff}
                    className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 gap-2 transition-colors"
                >
                    <CalendarOff className="h-4 w-4" /> 
                    <span className="hidden sm:inline">Dzień wolny</span>
                    <span className="inline sm:hidden">Wolne</span>
                </Button>
            )}
            <Button onClick={onAddEvent} className="shadow-sm gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> 
                <span className="hidden sm:inline">Umów nowe spotkanie</span>
                <span className="inline sm:hidden">Dodaj</span>
            </Button>
        </div>

      </div>
    </div>
  );
}